import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

/**
 * Attachment storage.
 *
 * Files live OUTSIDE `public/`. Anything under `public/` is served by Next as a
 * static asset with no authentication, which meant a `HIGHLY_CONFIDENTIAL`
 * document could be fetched by anyone holding (or guessing) its URL, without
 * logging in. Uploads now go to a private directory and are served only through
 * `GET /api/files/...`, which requires a session.
 */
const UPLOAD_BASE = path.join(process.cwd(), 'storage', 'uploads');
export const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

/** Route prefix that serves files from UPLOAD_BASE behind an auth check. */
export const FILE_ROUTE_PREFIX = '/api/files';

/** Modules allowed as the first path segment. Keeps the serving route strict. */
export const UPLOAD_MODULES = ['advisory', 'contracts', 'knowledge'] as const;
export type UploadModule = (typeof UPLOAD_MODULES)[number];

export interface SavedFile {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

export class UploadError extends Error {}

/**
 * Resolve a stored file to an absolute path, refusing anything that escapes the
 * upload root. Guards against `..` traversal and absolute-path injection in the
 * URL segments.
 */
export function resolveStoredFile(segments: string[]): string | null {
  if (segments.length < 2) return null;
  if (segments.some((s) => !s || s === '.' || s === '..' || s.includes('\0'))) return null;
  if (!UPLOAD_MODULES.includes(segments[0] as UploadModule)) return null;

  const target = path.resolve(UPLOAD_BASE, ...segments);
  const root = path.resolve(UPLOAD_BASE);
  // path.relative is empty for the root itself and starts with '..' when outside.
  const rel = path.relative(root, target);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return target;
}

/** Persist a file under storage/uploads/<module>/<ownerId>/ and return metadata. */
export async function saveFile(
  module: UploadModule,
  ownerId: string,
  file: File,
  maxBytes: number = MAX_UPLOAD_SIZE_BYTES,
): Promise<SavedFile> {
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / 1024 / 1024);
    throw new UploadError(`"${file.name}" exceeds the ${mb}MB attachment size limit`);
  }

  const dir = path.join(UPLOAD_BASE, module, ownerId);
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name);
  const safeName = `${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, safeName), buffer);

  return {
    fileName: file.name,
    fileUrl: `${FILE_ROUTE_PREFIX}/${module}/${ownerId}/${safeName}`,
    fileSize: file.size,
    fileType: file.type || 'application/octet-stream',
  };
}

export function saveUploadedFile(requestId: string, file: File): Promise<SavedFile> {
  return saveFile('advisory', requestId, file);
}

export function saveContractFile(contractId: string, file: File): Promise<SavedFile> {
  return saveFile('contracts', contractId, file);
}
