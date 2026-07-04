import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { logKnowledgeActivity } from '@/lib/knowledgeHistory';
import { transitionKnowledgeStage } from '@/lib/knowledgeWorkflow';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (existing.authorId !== user.id) {
      return NextResponse.json({ error: 'Only the document owner can submit it for review' }, { status: 403 });
    }
    if (existing.status !== 'DRAFT') {
      return NextResponse.json({ error: `Cannot submit a document in ${existing.status} status` }, { status: 400 });
    }

    const updated = await transitionKnowledgeStage(id, 'UNDER_REVIEW');
    await logKnowledgeActivity({
      documentId: id,
      actorId: user.id,
      action: 'SUBMITTED',
      description: `Document ${existing.documentNumber} submitted for review by ${user.name}`,
      fromValue: 'DRAFT',
      toValue: 'UNDER_REVIEW',
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to submit document:', error);
    return NextResponse.json({ error: 'Failed to submit document' }, { status: 500 });
  }
}
