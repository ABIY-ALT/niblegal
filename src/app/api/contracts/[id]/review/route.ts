import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { contractReviewSchema } from '@/lib/validations/contract';
import { logContractActivity } from '@/lib/contractHistory';
import { transitionContractStage } from '@/lib/contractWorkflow';
import { notifyContractWorkflow } from '@/lib/notifyContract';

/**
 * Legal-officer review outcome (BR-CMS-04, the "maker" step):
 *   APPROVE → PENDING_APPROVAL (send to manager)
 *   RETURN  → DRAFT (send back to requester)
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['legal_officer', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { decision, comments } = contractReviewSchema.parse(await req.json());

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    if (existing.status !== 'UNDER_REVIEW') {
      return NextResponse.json({ error: `Cannot review a contract in ${existing.status} status` }, { status: 400 });
    }
    if (decision === 'RETURN' && !comments?.trim()) {
      return NextResponse.json({ error: 'Comments are required when returning a contract' }, { status: 400 });
    }

    const nextStatus = decision === 'APPROVE' ? 'PENDING_APPROVAL' : 'DRAFT';
    const updated = await prisma.contract.update({ where: { id }, data: { status: nextStatus } });

    await transitionContractStage(id, nextStatus, user.id, comments);
    await logContractActivity({
      contractId: id,
      actorId: user.id,
      action: decision === 'APPROVE' ? 'REVIEW_PASSED' : 'REVIEW_RETURNED',
      description: `Legal review ${decision === 'APPROVE' ? 'completed — sent for approval' : 'returned to requester'} by ${user.name}${comments ? ` — ${comments}` : ''}`,
      fromValue: 'UNDER_REVIEW',
      toValue: nextStatus,
    });

    await notifyContractWorkflow({
      contractId: id,
      title: decision === 'APPROVE' ? 'Contract awaiting approval' : 'Contract returned',
      body: `${existing.contractNumber} — ${existing.title}`,
      type: 'APPROVAL',
      actorId: user.id,
      recipientRoles: decision === 'APPROVE' ? ['Manager'] : [],
      recipientIds: decision === 'RETURN' ? [existing.requesterId] : [],
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to record review:', error);
    return NextResponse.json({ error: 'Validation or server error' }, { status: 400 });
  }
}
