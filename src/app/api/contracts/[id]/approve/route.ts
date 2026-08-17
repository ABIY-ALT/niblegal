import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasAccess } from '@/lib/access';
import { contractApprovalSchema } from '@/lib/validations/contract';
import { logContractActivity } from '@/lib/contractHistory';
import { transitionContractStage } from '@/lib/contractWorkflow';
import { notifyContractWorkflow } from '@/lib/notifyContract';
import { assertCanApprove, SegregationError } from '@/lib/approvalGuards';
import type { ContractStatus, ContractApprovalStage } from '@prisma/client';

/**
 * Maker–checker approval (BR-CMS-05). Division Manager approves first; if the
 * contract requiresDirectorApproval it then needs the Department Director too.
 *   APPROVED (final) → APPROVED   REJECTED → DRAFT
 *   RETURNED → UNDER_REVIEW       DELEGATED → stays PENDING_APPROVAL
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasAccess(user, { permission: 'contract.approve', roles: ['manager'] })) {
      return NextResponse.json({ error: 'Forbidden — requires the contract.approve permission' }, { status: 403 });
    }

    const { decision, comments, delegatedToId } = contractApprovalSchema.parse(await req.json());
    if (['REJECTED', 'RETURNED'].includes(decision) && !comments?.trim()) {
      return NextResponse.json({ error: 'Comments are required for this decision' }, { status: 400 });
    }
    if (decision === 'DELEGATED' && !delegatedToId) {
      return NextResponse.json({ error: 'Select a delegate' }, { status: 400 });
    }

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    if (existing.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: `Cannot approve a contract in ${existing.status} status` }, { status: 400 });
    }

    const priorApprovals = await prisma.contractApproval.findMany({
      where: { contractId: id },
      orderBy: { decidedAt: 'desc' },
      select: { approverId: true, decision: true, stage: true },
    });

    // Maker–checker: the approver must not be the requester, the assigned
    // officer, or someone who already signed an earlier stage.
    try {
      assertCanApprove(
        user.id,
        { requesterId: existing.requesterId, assigneeId: existing.assigneeId },
        priorApprovals,
      );
    } catch (e) {
      if (e instanceof SegregationError) {
        return NextResponse.json({ error: e.message }, { status: 403 });
      }
      throw e;
    }

    const lastApproval = priorApprovals[0];
    const stage: ContractApprovalStage =
      lastApproval?.stage === 'DIVISION_MANAGER' &&
      lastApproval.decision === 'APPROVED' &&
      existing.requiresDirectorApproval
        ? 'DEPARTMENT_DIRECTOR'
        : 'DIVISION_MANAGER';

    await prisma.contractApproval.create({
      data: {
        contractId: id,
        stage,
        decision,
        comments: comments || null,
        approverId: user.id,
        delegatedToId: delegatedToId || null,
      },
    });

    let nextStatus: ContractStatus = existing.status;
    if (decision === 'REJECTED') nextStatus = 'DRAFT';
    else if (decision === 'RETURNED') nextStatus = 'UNDER_REVIEW';
    else if (decision === 'APPROVED') {
      nextStatus = stage === 'DIVISION_MANAGER' && existing.requiresDirectorApproval ? 'PENDING_APPROVAL' : 'APPROVED';
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        status: nextStatus,
        approvedAt: nextStatus === 'APPROVED' ? new Date() : existing.approvedAt,
      },
    });

    if (nextStatus !== existing.status) {
      await transitionContractStage(id, nextStatus, user.id, comments);
    }

    await logContractActivity({
      contractId: id,
      actorId: user.id,
      action: `${stage}_${decision}`,
      description: `${stage.replace('_', ' ')}: ${decision.toLowerCase()} by ${user.name}${comments ? ` — ${comments}` : ''}`,
      fromValue: existing.status,
      toValue: nextStatus,
    });

    await notifyContractWorkflow({
      contractId: id,
      title: `Contract ${decision.toLowerCase()}`,
      body: `${existing.contractNumber} — ${existing.title}`,
      type: 'APPROVAL',
      priority: decision === 'APPROVED' ? 'MEDIUM' : 'HIGH',
      actorId: user.id,
      recipientIds: [existing.requesterId, ...(existing.assigneeId ? [existing.assigneeId] : []), ...(delegatedToId ? [delegatedToId] : [])],
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to record contract approval:', error);
    return NextResponse.json({ error: 'Validation or server error' }, { status: 400 });
  }
}
