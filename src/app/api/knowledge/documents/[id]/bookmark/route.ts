import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const pinParam = searchParams.get('pin');

    if (pinParam !== null) {
      const bookmark = await prisma.knowledgeBookmark.update({
        where: { documentId_userId: { documentId: id, userId: user.id } },
        data: { isPinned: pinParam === '1' },
      });
      return NextResponse.json({ data: bookmark });
    }

    const bookmark = await prisma.knowledgeBookmark.upsert({
      where: { documentId_userId: { documentId: id, userId: user.id } },
      update: { lastViewedAt: new Date() },
      create: { documentId: id, userId: user.id },
    });

    return NextResponse.json({ data: bookmark }, { status: 201 });
  } catch (error) {
    console.error('Failed to bookmark document:', error);
    return NextResponse.json({ error: 'Failed to bookmark document' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.knowledgeBookmark.deleteMany({ where: { documentId: id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove bookmark:', error);
    return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
  }
}
