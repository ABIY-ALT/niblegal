import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { logKnowledgeActivity } from '@/lib/knowledgeHistory';
import { transitionKnowledgeStage } from '@/lib/knowledgeWorkflow';
import type { KnowledgeStatus } from '@prisma/client';

// Reviewer step decisions map onto the existing KnowledgeStatus enum:
// APPROVED -> APPROVED (reviewer-approved, now awaiting Manager Approval)
// RETURNED / REJECTED -> DRAFT (kicked back to the author; no distinct
// REJECTED status exists on KnowledgeDocument, so both map back to DRAFT,
// with the decision itself recorded on KnowledgeApproval).
const NEXT_STATUS: Record<string, KnowledgeStatus> = {
  APPROVED: 'APPROVED',
  RETURNED: 'DRAFT',
  REJECTED: 'DRAFT',
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['legal_officer', 'admin_assistant'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { decision, comments } = await req.json();
    if (!['APPROVED', 'RETURNED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }
    if ((decision === 'REJECTED' || decision === 'RETURNED') && !comments?.trim()) {
      return NextResponse.json({ error: 'Comments are required for this decision' }, { status: 400 });
    }

    const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (existing.status !== 'UNDER_REVIEW') {
      return NextResponse.json({ error: `Cannot review a document in ${existing.status} status` }, { status: 400 });
    }
    if (existing.authorId === user.id) {
      return NextResponse.json({ error: 'A reviewer must be different from the document owner' }, { status: 403 });
    }

    const nextStatus = NEXT_STATUS[decision];
    const updated = await transitionKnowledgeStage(id, nextStatus);

    await prisma.knowledgeApproval.create({
      data: { documentId: id, stage: 'REVIEWER', decision, comments: comments || null, approverId: user.id },
    });

    await logKnowledgeActivity({
      documentId: id,
      actorId: user.id,
      action: 'REVIEWED',
      description: `Review: ${decision.toLowerCase()} by ${user.name}${comments ? ` — ${comments}` : ''}`,
      fromValue: 'UNDER_REVIEW',
      toValue: nextStatus,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to record review:', error);
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }
}
