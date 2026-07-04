import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { generateReferenceNumber } from '@/lib/requestNumber';
import { logLegalActivity } from '@/lib/advisoryHistory';
import { transitionStage } from '@/lib/workflow';
import { notifyLegalWorkflow } from '@/lib/notifyLegal';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin_assistant', 'manager', 'legal_officer'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { recipientName, recipientEmail, notes } = await req.json();
    if (!recipientName?.trim()) return NextResponse.json({ error: 'Recipient is required' }, { status: 400 });

    const existing = await prisma.legalRequest.findUnique({ where: { id }, include: { opinion: true } });
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (existing.status !== 'APPROVED') {
      return NextResponse.json({ error: `Cannot dispatch a request in ${existing.status} status` }, { status: 400 });
    }
    if (!existing.opinion) return NextResponse.json({ error: 'No legal opinion to dispatch' }, { status: 400 });

    const lastApproval = await prisma.legalApproval.findFirst({
      where: { legalRequestId: id, decision: 'APPROVED', stage: { in: ['DIVISION_MANAGER', 'LEGAL_DIRECTOR'] } },
      orderBy: { decidedAt: 'desc' },
      include: { approver: true },
    });

    const referenceNumber = await generateReferenceNumber();
    const contentHash = crypto.createHash('sha256').update(existing.opinion.content).digest('hex');
    const signedBy = lastApproval ? `${lastApproval.approver.firstName} ${lastApproval.approver.lastName}` : user.name;

    await prisma.legalOpinion.update({
      where: { id: existing.opinion.id },
      data: { referenceNumber, contentHash, digitallySignedBy: signedBy, digitallySignedAt: new Date(), dispatchedAt: new Date() },
    });

    const updated = await prisma.legalRequest.update({ where: { id }, data: { status: 'DISPATCHED' } });
    await transitionStage(id, 'DISPATCHED', user.id, notes);

    await logLegalActivity({
      legalRequestId: id,
      actorId: user.id,
      action: 'DISPATCHED',
      description: `Opinion dispatched to ${recipientName}${recipientEmail ? ` (${recipientEmail})` : ''} by ${user.name}. Reference ${referenceNumber}.`,
      fromValue: 'APPROVED',
      toValue: 'DISPATCHED',
    });

    await notifyLegalWorkflow({
      legalRequestId: id,
      requestNumber: existing.requestNumber,
      title: 'Legal opinion dispatched',
      body: `Your legal opinion (ref ${referenceNumber}) has been finalized and sent to ${recipientName}.`,
      type: 'SUCCESS',
      actorId: user.id,
      recipientIds: [existing.requesterId],
      email: true,
    });

    return NextResponse.json({ data: updated, referenceNumber });
  } catch (error) {
    console.error('Failed to dispatch opinion:', error);
    return NextResponse.json({ error: 'Failed to dispatch opinion' }, { status: 500 });
  }
}
