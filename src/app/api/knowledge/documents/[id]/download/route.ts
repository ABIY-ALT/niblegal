import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const latestVersion = await prisma.knowledgeVersion.findFirst({
      where: { documentId: id },
      orderBy: { versionNumber: 'desc' },
    });
    if (!latestVersion?.fileUrl) {
      return NextResponse.json({ error: 'No downloadable file for this document' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.knowledgeDownload.create({ data: { documentId: id, userId: user.id } }),
      prisma.knowledgeDocument.update({ where: { id }, data: { downloads: { increment: 1 } } }),
    ]);

    return NextResponse.json({ data: { fileUrl: latestVersion.fileUrl, fileName: latestVersion.fileName } });
  } catch (error) {
    console.error('Failed to log download:', error);
    return NextResponse.json({ error: 'Failed to log download' }, { status: 500 });
  }
}
