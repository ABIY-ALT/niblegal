import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { resolveStoredFile, type UploadModule } from '@/lib/upload';

/**
 * Authenticated attachment delivery.
 *
 * Attachments used to sit in `public/uploads/...`, which Next serves as static
 * assets with no auth — a confidential document was readable by anyone with the
 * URL. Files now live in a private directory and are only reachable here, which
 * requires a session and applies the same record-level scoping the list APIs use.
 *
 * URL shape: /api/files/<module>/<ownerId>/<storedFileName>
 */

const CONTENT_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
};

/** Types safe to render inline. Everything else is forced to download. */
const INLINE_SAFE = new Set([
  'application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp',
  'text/plain; charset=utf-8', 'text/csv; charset=utf-8',
]);

type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * Record-level access check, mirroring the scoping the list endpoints already
 * apply. Legal staff see everything; a requesting organ only sees files hanging
 * off their own records (or their department's).
 */
async function canAccess(user: SessionUser, module: UploadModule, ownerId: string): Promise<boolean> {
  if (user.role !== 'requesting_organ') return true;

  if (module === 'contracts') {
    const contract = await prisma.contract.findUnique({
      where: { id: ownerId },
      select: { requesterId: true, requestingDepartmentId: true },
    });
    if (!contract) return false;
    return (
      contract.requesterId === user.id ||
      (!!user.departmentId && contract.requestingDepartmentId === user.departmentId)
    );
  }

  if (module === 'advisory') {
    const request = await prisma.legalRequest.findUnique({
      where: { id: ownerId },
      select: { requesterId: true, requestingDepartmentId: true },
    });
    if (!request) return false;
    return (
      request.requesterId === user.id ||
      (!!user.departmentId && request.requestingDepartmentId === user.departmentId)
    );
  }

  // Knowledge documents are shared reference material for signed-in staff.
  return true;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { path: segments } = await params;

  // Rejects traversal, absolute paths and unknown modules.
  const absolute = resolveStoredFile(segments);
  if (!absolute) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [module, ownerId] = segments as [UploadModule, string];
  if (!(await canAccess(user, module, ownerId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const info = await stat(absolute);
    if (!info.isFile()) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const buffer = await readFile(absolute);
    const ext = path.extname(absolute).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';

    const wantsDownload = req.nextUrl.searchParams.get('download') === '1';
    const disposition = wantsDownload || !INLINE_SAFE.has(contentType) ? 'attachment' : 'inline';
    const downloadName = req.nextUrl.searchParams.get('name');
    const safeName = downloadName?.replace(/[^\w.\-() ]/g, '_');

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(info.size),
        'Content-Disposition': safeName
          ? `${disposition}; filename="${safeName}"`
          : disposition,
        // Attachments can be confidential — never let a shared cache hold them.
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
