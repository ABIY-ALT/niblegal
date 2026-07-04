import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { logLegalActivity } from '@/lib/advisoryHistory';
import { transitionStage } from '@/lib/workflow';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.legalRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (!['DRAFT', 'RETURNED'].includes(existing.status)) {
      return NextResponse.json({ error: `Cannot submit a request in ${existing.status} status` }, { status: 400 });
    }

    const updated = await prisma.legalRequest.update({ where: { id }, data: { status: 'SUBMITTED' } });
    await transitionStage(id, 'SUBMITTED', user.id);
    await logLegalActivity({
      legalRequestId: id,
      actorId: user.id,
      action: 'SUBMITTED',
      description: `Request ${existing.requestNumber} submitted by ${user.name}`,
      fromValue: existing.status,
      toValue: 'SUBMITTED',
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to submit request:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}
