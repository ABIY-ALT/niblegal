import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { contractUpdateSchema } from '@/lib/validations/contract';
import { logContractActivity } from '@/lib/contractHistory';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, department: { select: { name: true } } } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        requestingDepartment: { select: { id: true, name: true } },
        versions: { orderBy: { version: 'desc' } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { firstName: true, lastName: true } } },
        },
        approvals: {
          orderBy: { decidedAt: 'desc' },
          include: {
            approver: { select: { firstName: true, lastName: true } },
            delegatedTo: { select: { firstName: true, lastName: true } },
          },
        },
        assignments: {
          orderBy: { createdAt: 'desc' },
          include: {
            officer: { select: { firstName: true, lastName: true } },
            assignedBy: { select: { firstName: true, lastName: true } },
          },
        },
        workflowSteps: { orderBy: { enteredAt: 'asc' }, include: { actor: { select: { firstName: true, lastName: true } } } },
        history: {
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!contract) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    return NextResponse.json({ data: contract });
  } catch (error) {
    console.error('Failed to fetch contract:', error);
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'requesting_organ') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    if (!['DRAFT', 'UNDER_REVIEW'].includes(existing.status)) {
      return NextResponse.json({ error: `Cannot edit a contract in ${existing.status} status` }, { status: 400 });
    }

    const body = await req.json();
    const data = contractUpdateSchema.parse(body);

    const updated = await prisma.contract.update({ where: { id }, data });
    await logContractActivity({
      contractId: id,
      actorId: user.id,
      action: 'UPDATED',
      description: `Contract details updated by ${user.name}`,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to update contract:', error);
    return NextResponse.json({ error: 'Validation or server error' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'manager') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    if (existing.status !== 'DRAFT') {
      return NextResponse.json({ error: 'Only draft contracts can be deleted' }, { status: 400 });
    }

    await prisma.contract.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete contract:', error);
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}
