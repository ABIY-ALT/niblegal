import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { litigationHearingSchema } from '@/lib/validations/litigation';
import { logLitigationActivity } from '@/lib/litigationHistory';
import { format } from 'date-fns';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const data = litigationHearingSchema.parse(body);

    const hearing = await prisma.litigationHearing.create({
      data: { ...data, caseId: id },
    });

    await logLitigationActivity({
      caseId: id,
      actorId: user.id,
      action: 'HEARING_SCHEDULED',
      description: `${user.name} scheduled a ${data.type.toLowerCase()} for ${format(data.scheduledAt, 'MMM d, yyyy p')}`,
    });

    return NextResponse.json({ data: hearing }, { status: 201 });
  } catch (error) {
    console.error('Failed to create hearing:', error);
    return NextResponse.json({ error: 'Validation or server error' }, { status: 400 });
  }
}
