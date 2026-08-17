import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasAccess } from '@/lib/access';
import { logContractActivity } from '@/lib/contractHistory';
import { transitionContractStage } from '@/lib/contractWorkflow';
import { notifyContractWorkflow } from '@/lib/notifyContract';

/** APPROVED → EXECUTED/ACTIVE: record execution after signatures (BR-CMS-04). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasAccess(user, { permission: 'contract.execute', roles: ['legal_officer', 'manager'] })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    if (existing.status !== 'APPROVED') {
      return NextResponse.json({ error: `Cannot execute a contract in ${existing.status} status` }, { status: 400 });
    }

    // Active immediately unless a future start date was set.
    const now = new Date();
    const active = !existing.startDate || existing.startDate <= now;
    const nextStatus = active ? 'ACTIVE' : 'EXECUTED';

    const updated = await prisma.contract.update({
      where: { id },
      data: { status: nextStatus, executedAt: now },
    });

    await transitionContractStage(id, nextStatus, user.id);
    await logContractActivity({
      contractId: id,
      actorId: user.id,
      action: 'EXECUTED',
      description: `Contract executed by ${user.name}`,
      fromValue: 'APPROVED',
      toValue: nextStatus,
    });
    await notifyContractWorkflow({
      contractId: id,
      title: 'Contract executed',
      body: `${existing.contractNumber} — ${existing.title}`,
      type: 'SUCCESS',
      actorId: user.id,
      recipientIds: [existing.requesterId, ...(existing.assigneeId ? [existing.assigneeId] : [])],
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to execute contract:', error);
    return NextResponse.json({ error: 'Failed to execute contract' }, { status: 500 });
  }
}
