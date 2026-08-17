import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasAccess } from '@/lib/access';
import { logLegalActivity } from '@/lib/advisoryHistory';
import { transitionStage } from '@/lib/workflow';
import { notifyLegalWorkflow } from '@/lib/notifyLegal';
import { assertCanApprove, SegregationError } from '@/lib/approvalGuards';
import type { LegalRequestStatus, ApprovalStage } from '@prisma/client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasAccess(user, { permission: 'advisory.approve', roles: ['manager'] })) {
      return NextResponse.json({ error: 'Forbidden — requires the advisory.approve permission' }, { status: 403 });
    }

    const { decision, comments, delegatedToId } = await req.json();
    if (!['APPROVED', 'REJECTED', 'RETURNED', 'DELEGATED'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }
    if (['REJECTED', 'RETURNED'].includes(decision) && !comments?.trim()) {
      return NextResponse.json({ error: 'Comments are required for this decision' }, { status: 400 });
    }
    if (decision === 'DELEGATED' && !delegatedToId) {
      return NextResponse.json({ error: 'Select a delegate' }, { status: 400 });
    }

    const existing = await prisma.legalRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (existing.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: `Cannot approve a request in ${existing.status} status` }, { status: 400 });
    }

    const priorApprovals = await prisma.legalApproval.findMany({
      where: { legalRequestId: id, stage: { in: ['DIVISION_MANAGER', 'LEGAL_DIRECTOR'] } },
      orderBy: { decidedAt: 'desc' },
      select: { approverId: true, decision: true, stage: true },
    });

    // Maker–checker: not the requester, not the drafting officer, and not
    // someone who already signed an earlier stage.
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

    const lastManagerApproval = priorApprovals[0];
    const stage: ApprovalStage =
      lastManagerApproval?.stage === 'DIVISION_MANAGER' &&
      lastManagerApproval.decision === 'APPROVED' &&
      existing.requiresDirectorApproval
        ? 'LEGAL_DIRECTOR'
        : 'DIVISION_MANAGER';

    await prisma.legalApproval.create({
      data: {
        legalRequestId: id,
        stage,
        decision,
        comments: comments || null,
        approverId: user.id,
        delegatedToId: delegatedToId || null,
      },
    });

    let nextStatus: LegalRequestStatus = existing.status;
    if (decision === 'REJECTED') nextStatus = 'REJECTED';
    else if (decision === 'RETURNED') nextStatus = 'RETURNED';
    else if (decision === 'APPROVED') {
      nextStatus = stage === 'DIVISION_MANAGER' && existing.requiresDirectorApproval ? 'PENDING_APPROVAL' : 'APPROVED';
    }
    // DELEGATED keeps the request in PENDING_APPROVAL for the delegate to act on.

    const updated = await prisma.legalRequest.update({ where: { id }, data: { status: nextStatus } });

    if (nextStatus !== existing.status) {
      await transitionStage(id, nextStatus, user.id, comments);
    }

    await logLegalActivity({
      legalRequestId: id,
      actorId: user.id,
      action: `${stage}_${decision}`,
      description: `${stage.replace('_', ' ')}: ${decision.toLowerCase()} by ${user.name}${comments ? ` — ${comments}` : ''}`,
      fromValue: existing.status,
      toValue: nextStatus,
    });

    await notifyLegalWorkflow({
      legalRequestId: id,
      requestNumber: existing.requestNumber,
      title: `Advisory request ${decision.toLowerCase()}`,
      body: existing.subject,
      type: 'APPROVAL',
      priority: decision === 'APPROVED' ? 'MEDIUM' : 'HIGH',
      actorId: user.id,
      recipientIds: [existing.requesterId, ...(existing.assigneeId ? [existing.assigneeId] : []), ...(delegatedToId ? [delegatedToId] : [])],
      email: true,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to record approval:', error);
    return NextResponse.json({ error: 'Failed to record approval' }, { status: 500 });
  }
}
