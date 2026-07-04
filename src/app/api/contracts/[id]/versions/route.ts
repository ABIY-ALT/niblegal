import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { saveContractFile, UploadError } from '@/lib/upload';
import { logContractActivity } from '@/lib/contractHistory';

/** Upload a new contract document version (BR-CMS-02, version control). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'requesting_organ') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contract = await prisma.contract.findUnique({ where: { id }, select: { id: true } });
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    const notes = (formData.get('notes') as string) || null;

    const saved = await saveContractFile(id, file);

    const last = await prisma.contractVersion.findFirst({
      where: { contractId: id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const version = (last?.version ?? 0) + 1;

    const created = await prisma.contractVersion.create({
      data: { ...saved, version, notes, contractId: id, uploadedById: user.id },
    });

    await logContractActivity({
      contractId: id,
      actorId: user.id,
      action: 'VERSION_UPLOADED',
      description: `Version ${version} (${saved.fileName}) uploaded by ${user.name}`,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to upload contract version:', error);
    return NextResponse.json({ error: 'Failed to upload version' }, { status: 500 });
  }
}
