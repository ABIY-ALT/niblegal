import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { litigationCaseUpdateSchema } from '@/lib/validations/litigation';
import { logLitigationActivity } from '@/lib/litigationHistory';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const item = await prisma.litigationCase.findUnique({
      where: { id },
      include: {
        assignedOfficer: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        requestingDepartment: { select: { id: true, name: true } },
        hearings: { orderBy: { scheduledAt: 'asc' } },
        history: {
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { firstName: true, lastName: true } } },
        },
      },
    });

    if (!item) return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    return NextResponse.json({ data: item });
  } catch (error) {
    console.error('Failed to fetch litigation case:', error);
    return NextResponse.json({ error: 'Failed to fetch litigation case' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['manager', 'legal_officer', 'admin_assistant'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.litigationCase.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

    const body = await req.json();
    const data = litigationCaseUpdateSchema.parse(body);

    const updated = await prisma.litigationCase.update({ where: { id }, data });

    if (data.status && data.status !== existing.status) {
      await logLitigationActivity({
        caseId: id,
        actorId: user.id,
        action: 'STATUS_CHANGED',
        description: `${user.name} changed status from ${existing.status} to ${data.status}`,
        fromValue: existing.status,
        toValue: data.status,
      });
    } else {
      await logLitigationActivity({
        caseId: id,
        actorId: user.id,
        action: 'UPDATED',
        description: `Case details updated by ${user.name}`,
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to update litigation case:', error);
    return NextResponse.json({ error: 'Validation or server error' }, { status: 400 });
  }
}
