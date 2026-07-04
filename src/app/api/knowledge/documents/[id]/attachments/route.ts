import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { saveKnowledgeFile, UploadError } from '@/lib/uploadKnowledge';
import { logKnowledgeActivity } from '@/lib/knowledgeHistory';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const doc = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const formData = await req.formData();
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);
    if (files.length === 0) return NextResponse.json({ error: 'No files provided' }, { status: 400 });

    const saved = await Promise.all(files.map((f) => saveKnowledgeFile(id, f)));

    const attachments = await prisma.$transaction(
      saved.map((s) =>
        prisma.knowledgeAttachment.create({
          data: { ...s, documentId: id, uploadedById: user.id },
          include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
        }),
      ),
    );

    await logKnowledgeActivity({
      documentId: id,
      actorId: user.id,
      action: 'ATTACHMENT_UPLOADED',
      description: `${saved.length} file(s) uploaded by ${user.name}`,
    });

    return NextResponse.json({ data: attachments }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to upload attachments:', error);
    return NextResponse.json({ error: 'Failed to upload attachments' }, { status: 500 });
  }
}
