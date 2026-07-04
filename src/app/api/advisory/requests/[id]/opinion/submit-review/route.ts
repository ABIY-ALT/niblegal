import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { logLegalActivity } from '@/lib/advisoryHistory';
import { transitionStage } from '@/lib/workflow';
import { notifyLegalWorkflow } from '@/lib/notifyLegal';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const legalRequest = await prisma.legalRequest.findUnique({ where: { id }, include: { opinion: true } });
    if (!legalRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (legalRequest.assigneeId !== user.id) {
      return NextResponse.json({ error: 'Only the assigned officer can submit this opinion for review' }, { status: 403 });
    }
    if (!legalRequest.opinion || !legalRequest.opinion.content.trim()) {
      return NextResponse.json({ error: 'Draft an opinion before submitting for review' }, { status: 400 });
    }
    if (legalRequest.status !== 'DRAFTING') {
      return NextResponse.json({ error: `Cannot submit for review from ${legalRequest.status} status` }, { status: 400 });
    }

    const updated = await prisma.legalRequest.update({ where: { id }, data: { status: 'REVIEW' } });
    await transitionStage(id, 'REVIEW', user.id);
    await logLegalActivity({
      legalRequestId: id,
      actorId: user.id,
      action: 'SUBMITTED_FOR_REVIEW',
      description: `Opinion submitted for peer review by ${user.name}`,
      fromValue: 'DRAFTING',
      toValue: 'REVIEW',
    });

    await notifyLegalWorkflow({
      legalRequestId: id,
      requestNumber: legalRequest.requestNumber,
      title: 'Opinion awaiting your review',
      body: legalRequest.subject,
      type: 'APPROVAL',
      actorId: user.id,
      recipientRoles: ['Manager'],
      email: true,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to submit opinion for review:', error);
    return NextResponse.json({ error: 'Failed to submit opinion for review' }, { status: 500 });
  }
}
