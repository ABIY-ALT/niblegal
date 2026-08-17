import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const upcomingOnly = searchParams.get('upcoming') === 'true';

    const hearings = await prisma.litigationHearing.findMany({
      where: upcomingOnly ? { scheduledAt: { gte: new Date() } } : undefined,
      orderBy: { scheduledAt: 'asc' },
      include: {
        case: {
          select: {
            id: true, caseNumber: true, title: true, court: true, status: true, riskLevel: true,
            assignedOfficer: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return NextResponse.json({ data: hearings });
  } catch (error) {
    console.error('Failed to fetch hearings:', error);
    return NextResponse.json({ error: 'Failed to fetch hearings' }, { status: 500 });
  }
}
