import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { logLegalActivity } from '@/lib/advisoryHistory';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin_assistant', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { ids, action, officerId } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No requests selected' }, { status: 400 });
    }

    if (action !== 'REASSIGN') {
      return NextResponse.json({ error: 'Unsupported bulk action' }, { status: 400 });
    }
    if (!officerId) return NextResponse.json({ error: 'Officer is required' }, { status: 400 });

    const officer = await prisma.user.findUnique({ where: { id: officerId } });
    if (!officer) return NextResponse.json({ error: 'Officer not found' }, { status: 404 });

    let updated = 0;
    for (const id of ids as string[]) {
      const existing = await prisma.legalRequest.findUnique({ where: { id } });
      if (!existing) continue;

      const nextStatus = ['SUBMITTED', 'VALIDATED'].includes(existing.status) ? 'ASSIGNED' : existing.status;
      await prisma.legalRequest.update({ where: { id }, data: { assigneeId: officerId, status: nextStatus } });
      await prisma.legalAssignment.create({
        data: {
          legalRequestId: id,
          action: 'REASSIGNED',
          officerId,
          previousOfficerId: existing.assigneeId,
          assignedById: user.id,
          notes: 'Bulk reassignment',
        },
      });
      await logLegalActivity({
        legalRequestId: id,
        actorId: user.id,
        action: 'REASSIGNED',
        description: `Bulk reassigned to ${officer.firstName} ${officer.lastName} by ${user.name}`,
      });
      updated += 1;
    }

    return NextResponse.json({ success: true, count: updated });
  } catch (error) {
    console.error('Bulk action failed:', error);
    return NextResponse.json({ error: 'Bulk action failed' }, { status: 500 });
  }
}
