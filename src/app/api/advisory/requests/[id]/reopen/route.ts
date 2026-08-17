import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasAccess } from '@/lib/access';
import { logLegalActivity } from '@/lib/advisoryHistory';
import { transitionStage } from '@/lib/workflow';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasAccess(user, { permission: 'advisory.approve', roles: ['manager'] })) {
      return NextResponse.json({ error: 'Only a Division Manager can reopen a closed request' }, { status: 403 });
    }

    const existing = await prisma.legalRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (!['CLOSED', 'ARCHIVED'].includes(existing.status)) {
      return NextResponse.json({ error: `Cannot reopen a request in ${existing.status} status` }, { status: 400 });
    }

    const updated = await prisma.legalRequest.update({
      where: { id },
      data: { status: 'DISPATCHED', closedAt: null, archivedAt: null },
    });
    await transitionStage(id, 'DISPATCHED', user.id, 'Reopened');

    await logLegalActivity({
      legalRequestId: id,
      actorId: user.id,
      action: 'REOPENED',
      description: `Request reopened by ${user.name}`,
      fromValue: existing.status,
      toValue: 'DISPATCHED',
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to reopen request:', error);
    return NextResponse.json({ error: 'Failed to reopen request' }, { status: 500 });
  }
}
