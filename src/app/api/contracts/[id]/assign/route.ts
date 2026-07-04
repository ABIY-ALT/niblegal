import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { contractAssignSchema } from '@/lib/validations/contract';
import { logContractActivity } from '@/lib/contractHistory';
import { notifyContractWorkflow } from '@/lib/notifyContract';

/** Assign or reassign a drafting/review officer (BR-CMS-04). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['manager', 'admin_assistant'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { assigneeId, notes } = contractAssignSchema.parse(await req.json());

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });

    const officer = await prisma.user.findUnique({ where: { id: assigneeId }, select: { firstName: true, lastName: true } });
    if (!officer) return NextResponse.json({ error: 'Officer not found' }, { status: 404 });

    const reassignment = existing.assigneeId && existing.assigneeId !== assigneeId;

    const updated = await prisma.contract.update({ where: { id }, data: { assigneeId } });

    await prisma.contractAssignment.create({
      data: {
        contractId: id,
        action: reassignment ? 'REASSIGNED' : 'ASSIGNED',
        officerId: assigneeId,
        previousOfficerId: existing.assigneeId ?? null,
        assignedById: user.id,
        notes: notes || null,
      },
    });

    await logContractActivity({
      contractId: id,
      actorId: user.id,
      action: reassignment ? 'REASSIGNED' : 'ASSIGNED',
      description: `${reassignment ? 'Reassigned' : 'Assigned'} to ${officer.firstName} ${officer.lastName} by ${user.name}`,
    });

    await notifyContractWorkflow({
      contractId: id,
      title: 'Contract assigned to you',
      body: `${existing.contractNumber} — ${existing.title}`,
      type: 'APPROVAL',
      actorId: user.id,
      recipientIds: [assigneeId],
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to assign contract:', error);
    return NextResponse.json({ error: 'Validation or server error' }, { status: 400 });
  }
}
