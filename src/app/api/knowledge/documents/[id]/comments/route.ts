import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { knowledgeCommentSchema } from '@/lib/validations/knowledge';
import { logKnowledgeActivity } from '@/lib/knowledgeHistory';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = knowledgeCommentSchema.parse(body);

    const comment = await prisma.knowledgeComment.create({
      data: { documentId: id, authorId: user.id, text: validated.text, isInternal: validated.isInternal },
      include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });

    await logKnowledgeActivity({
      documentId: id,
      actorId: user.id,
      action: 'COMMENTED',
      description: `${user.name} added a comment`,
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error('Failed to add comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 400 });
  }
}
