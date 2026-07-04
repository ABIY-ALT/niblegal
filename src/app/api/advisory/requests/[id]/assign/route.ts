import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { assignmentSchema } from '@/lib/validations/advisory';
import { calculateDeadline } from '@/lib/sla';
import { logLegalActivity } from '@/lib/advisoryHistory';
import { transitionStage } from '@/lib/workflow';
import { notifyLegalWorkflow } from '@/lib/notifyLegal';
import type { Prisma, LegalRequestStatus } from '@prisma/client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin_assistant', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validated = assignmentSchema.parse(body);

    const existing = await prisma.legalRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });

    const data: Prisma.LegalRequestUpdateInput = {};
    if (validated.officerId) data.assignee = { connect: { id: validated.officerId } };
    if (validated.priority) data.priority = validated.priority;
    if (validated.slaHours) {
      data.slaHours = validated.slaHours;
      data.slaDeadline = calculateDeadline(validated.slaHours, existing.createdAt);
    }

    let nextStatus: LegalRequestStatus = existing.status;
    if (validated.action === 'ESCALATED') {
      nextStatus = 'ESCALATED';
    } else if (['VALIDATED', 'SUBMITTED', 'ESCALATED'].includes(existing.status) || !existing.assigneeId) {
      nextStatus = 'ASSIGNED';
    }
    data.status = nextStatus;

    const updated = await prisma.legalRequest.update({ where: { id }, data });

    await prisma.legalAssignment.create({
      data: {
        legalRequestId: id,
        action: validated.action,
        officerId: validated.officerId ?? existing.assigneeId,
        previousOfficerId: existing.assigneeId,
        assignedById: user.id,
        priority: validated.priority ?? null,
        slaHours: validated.slaHours ?? null,
        notes: validated.notes ?? null,
      },
    });

    if (nextStatus !== existing.status) {
      await transitionStage(id, nextStatus, user.id, validated.notes);
    }

    await logLegalActivity({
      legalRequestId: id,
      actorId: user.id,
      action: validated.action,
      description: `${validated.action.replace(/_/g, ' ')} by ${user.name}${validated.notes ? `: ${validated.notes}` : ''}`,
      fromValue: existing.status,
      toValue: nextStatus,
    });

    const officerId = validated.officerId ?? existing.assigneeId;
    if (officerId) {
      await notifyLegalWorkflow({
        legalRequestId: id,
        requestNumber: existing.requestNumber,
        title: validated.action === 'ESCALATED' ? 'Advisory request escalated to you' : 'Advisory request assigned to you',
        body: existing.subject,
        type: 'APPROVAL',
        priority: validated.action === 'ESCALATED' ? 'HIGH' : 'MEDIUM',
        actorId: user.id,
        recipientIds: [officerId],
        email: true,
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to assign request:', error);
    return NextResponse.json({ error: 'Failed to assign request' }, { status: 400 });
  }
}
