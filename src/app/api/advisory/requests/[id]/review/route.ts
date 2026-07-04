import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { logLegalActivity } from '@/lib/advisoryHistory';
import { transitionStage } from '@/lib/workflow';
import type { LegalRequestStatus } from '@prisma/client';

const NEXT_STATUS: Record<string, LegalRequestStatus> = {
  APPROVED: 'PENDING_APPROVAL',
  RETURNED: 'RETURNED',
  REJECTED: 'REJECTED',
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'legal_officer') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { decision, comments } = await req.json();
    if (!['APPROVED', 'RETURNED', 'REJECTED'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }
    if ((decision === 'REJECTED' || decision === 'RETURNED') && !comments?.trim()) {
      return NextResponse.json({ error: 'Comments are required for this decision' }, { status: 400 });
    }

    const existing = await prisma.legalRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (existing.status !== 'REVIEW') {
      return NextResponse.json({ error: `Cannot review a request in ${existing.status} status` }, { status: 400 });
    }
    if (existing.assigneeId === user.id) {
      return NextResponse.json({ error: 'A peer reviewer must be different from the drafting officer' }, { status: 403 });
    }

    const nextStatus = NEXT_STATUS[decision];
    const updated = await prisma.legalRequest.update({ where: { id }, data: { status: nextStatus } });

    await prisma.legalApproval.create({
      data: { legalRequestId: id, stage: 'PEER_REVIEW', decision, comments: comments || null, approverId: user.id },
    });
    await transitionStage(id, nextStatus, user.id, comments);
    await logLegalActivity({
      legalRequestId: id,
      actorId: user.id,
      action: 'PEER_REVIEWED',
      description: `Peer review: ${decision} by ${user.name}${comments ? ` — ${comments}` : ''}`,
      fromValue: 'REVIEW',
      toValue: nextStatus,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to record review:', error);
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }
}
