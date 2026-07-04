import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { logContractActivity } from '@/lib/contractHistory';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });

    const contract = await prisma.contract.findUnique({ where: { id }, select: { id: true } });
    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

    const comment = await prisma.comment.create({
      data: { text: text.trim(), authorId: user.id, contractId: id },
      include: { author: { select: { firstName: true, lastName: true } } },
    });

    await logContractActivity({
      contractId: id,
      actorId: user.id,
      action: 'COMMENTED',
      description: `${user.name} added a comment`,
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error('Failed to add comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
