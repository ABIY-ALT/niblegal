import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { logKnowledgeActivity } from '@/lib/knowledgeHistory';
import { transitionKnowledgeStage } from '@/lib/knowledgeWorkflow';
import { notifyKnowledge } from '@/lib/notifyKnowledge';
import type { KnowledgeStatus } from '@prisma/client';

const NEXT_STATUS: Record<string, KnowledgeStatus> = {
  APPROVED: 'PUBLISHED',
  RETURNED: 'DRAFT',
  REJECTED: 'DRAFT',
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { decision, comments } = await req.json();
    if (!['APPROVED', 'RETURNED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }
    if ((decision === 'REJECTED' || decision === 'RETURNED') && !comments?.trim()) {
      return NextResponse.json({ error: 'Comments are required for this decision' }, { status: 400 });
    }

    const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (existing.status !== 'APPROVED') {
      return NextResponse.json({ error: `Cannot approve a document in ${existing.status} status` }, { status: 400 });
    }

    const nextStatus = NEXT_STATUS[decision];
    const updated = await transitionKnowledgeStage(id, nextStatus);

    await prisma.knowledgeApproval.create({
      data: { documentId: id, stage: 'MANAGER', decision, comments: comments || null, approverId: user.id },
    });

    await logKnowledgeActivity({
      documentId: id,
      actorId: user.id,
      action: 'MANAGER_APPROVAL',
      description: `Manager approval: ${decision.toLowerCase()} by ${user.name}${comments ? ` — ${comments}` : ''}`,
      fromValue: 'APPROVED',
      toValue: nextStatus,
    });

    if (nextStatus === 'PUBLISHED') {
      await notifyKnowledge({
        documentId: id,
        actorId: user.id,
        title: 'New Document Published',
        message: `${existing.title} (${existing.documentNumber}) is now published in the Knowledge Repository`,
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to record manager approval:', error);
    return NextResponse.json({ error: 'Failed to record manager approval' }, { status: 500 });
  }
}
