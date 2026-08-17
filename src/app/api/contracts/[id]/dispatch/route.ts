import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasAccess } from '@/lib/access';
import { logContractActivity } from '@/lib/contractHistory';
import { notifyContractWorkflow } from '@/lib/notifyContract';

/** Dispatch the executed contract back to the requesting organ (BR-CMS-04). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasAccess(user, { permission: 'contract.execute', roles: ['legal_officer', 'manager', 'admin_assistant'] })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    if (!['EXECUTED', 'ACTIVE'].includes(existing.status)) {
      return NextResponse.json({ error: 'Only executed contracts can be dispatched' }, { status: 400 });
    }

    const updated = await prisma.contract.update({ where: { id }, data: { dispatchedAt: new Date() } });

    await logContractActivity({
      contractId: id,
      actorId: user.id,
      action: 'DISPATCHED',
      description: `Executed contract dispatched to the requesting organ by ${user.name}`,
    });
    await notifyContractWorkflow({
      contractId: id,
      title: 'Contract dispatched',
      body: `${existing.contractNumber} — ${existing.title} has been finalized and dispatched.`,
      type: 'SUCCESS',
      actorId: user.id,
      recipientIds: [existing.requesterId],
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to dispatch contract:', error);
    return NextResponse.json({ error: 'Failed to dispatch contract' }, { status: 500 });
  }
}
