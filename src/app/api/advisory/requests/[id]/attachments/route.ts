import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { saveUploadedFile, UploadError } from '@/lib/upload';
import { logLegalActivity } from '@/lib/advisoryHistory';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const legalRequest = await prisma.legalRequest.findUnique({ where: { id } });
    if (!legalRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const formData = await req.formData();
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);
    if (files.length === 0) return NextResponse.json({ error: 'No files provided' }, { status: 400 });

    const category = (formData.get('category') as string) || 'SUPPORTING_DOCUMENT';

    const saved = await Promise.all(files.map((f) => saveUploadedFile(id, f)));

    const attachments = await prisma.$transaction(
      saved.map((s) =>
        prisma.legalAttachment.create({
          data: { ...s, category: category as never, legalRequestId: id, uploadedById: user.id },
          include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
        }),
      ),
    );

    await logLegalActivity({
      legalRequestId: id,
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
