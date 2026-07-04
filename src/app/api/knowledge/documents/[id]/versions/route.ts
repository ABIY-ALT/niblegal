import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { saveKnowledgeFile, UploadError } from '@/lib/uploadKnowledge';
import { logKnowledgeActivity } from '@/lib/knowledgeHistory';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const versions = await prisma.knowledgeVersion.findMany({
    where: { documentId: id },
    orderBy: { versionNumber: 'desc' },
    include: {
      uploadedBy: { select: { id: true, firstName: true, lastName: true } },
      approvedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  return NextResponse.json({ data: versions });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'requesting_organ') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const doc = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const formData = await req.formData();
    const changes = formData.get('changes');
    const content = formData.get('content');
    const file = formData.get('file');

    const nextVersionNumber = doc.currentVersion + 1;
    let versionData: Record<string, unknown> = {
      documentId: id,
      versionNumber: nextVersionNumber,
      uploadedById: user.id,
      changes: typeof changes === 'string' && changes ? changes : null,
    };

    if (file instanceof File && file.size > 0) {
      const saved = await saveKnowledgeFile(id, file);
      versionData = { ...versionData, ...saved };
    } else if (typeof content === 'string' && content) {
      versionData = { ...versionData, content };
    } else {
      return NextResponse.json({ error: 'Provide either a file or content for the new version' }, { status: 400 });
    }

    const version = await prisma.knowledgeVersion.create({ data: versionData as never });
    await prisma.knowledgeDocument.update({
      where: { id },
      data: {
        currentVersion: nextVersionNumber,
        ...(typeof content === 'string' && content ? { content } : {}),
      },
    });

    await logKnowledgeActivity({
      documentId: id,
      actorId: user.id,
      action: 'NEW_VERSION',
      description: `Version ${nextVersionNumber} uploaded by ${user.name}${changes ? `: ${changes}` : ''}`,
    });

    return NextResponse.json({ data: version }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to create new version:', error);
    return NextResponse.json({ error: 'Failed to create new version' }, { status: 500 });
  }
}
