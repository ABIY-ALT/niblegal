import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasAccess } from '@/lib/access';
import { logLegalActivity } from '@/lib/advisoryHistory';
import { transitionStage } from '@/lib/workflow';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasAccess(user, { permission: 'advisory.assign', roles: ['admin_assistant', 'manager'] })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { approve, notes } = await req.json();
    const existing = await prisma.legalRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (existing.status !== 'SUBMITTED') {
      return NextResponse.json({ error: `Cannot validate a request in ${existing.status} status` }, { status: 400 });
    }

    const nextStatus = approve ? 'VALIDATED' : 'RETURNED';
    const updated = await prisma.legalRequest.update({ where: { id }, data: { status: nextStatus } });
    await transitionStage(id, nextStatus, user.id, notes);

    if (notes) {
      await prisma.legalComment.create({
        data: { legalRequestId: id, authorId: user.id, text: notes, isInternal: true },
      });
    }

    await logLegalActivity({
      legalRequestId: id,
      actorId: user.id,
      action: approve ? 'VALIDATED' : 'RETURNED_FOR_CORRECTION',
      description: approve
        ? `Request validated by ${user.name}`
        : `Request returned for correction by ${user.name}${notes ? `: ${notes}` : ''}`,
      fromValue: 'SUBMITTED',
      toValue: nextStatus,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to validate request:', error);
    return NextResponse.json({ error: 'Failed to validate request' }, { status: 500 });
  }
}
