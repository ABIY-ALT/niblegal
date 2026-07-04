import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { logContractActivity } from '@/lib/contractHistory';
import { transitionContractStage } from '@/lib/contractWorkflow';
import { notifyContractWorkflow } from '@/lib/notifyContract';

/** DRAFT → UNDER_REVIEW: hand the request to the legal team (BR-CMS-04). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    if (existing.status !== 'DRAFT') {
      return NextResponse.json({ error: `Cannot submit a contract in ${existing.status} status` }, { status: 400 });
    }
    if (user.role === 'requesting_organ' && existing.requesterId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.contract.update({
      where: { id },
      data: { status: 'UNDER_REVIEW', submittedAt: new Date() },
    });

    await transitionContractStage(id, 'UNDER_REVIEW', user.id);
    await logContractActivity({
      contractId: id,
      actorId: user.id,
      action: 'SUBMITTED',
      description: `Contract submitted for legal review by ${user.name}`,
      fromValue: 'DRAFT',
      toValue: 'UNDER_REVIEW',
    });
    await notifyContractWorkflow({
      contractId: id,
      title: 'Contract submitted for review',
      body: `${existing.contractNumber} — ${existing.title}`,
      actorId: user.id,
      recipientRoles: ['Manager', 'Legal Officer'],
      recipientIds: existing.assigneeId ? [existing.assigneeId] : [],
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to submit contract:', error);
    return NextResponse.json({ error: 'Failed to submit contract' }, { status: 500 });
  }
}
