import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { LitigationStatus } from '@prisma/client';

const OPEN_STATUSES: LitigationStatus[] = ['ACTIVE', 'PENDING', 'ON_HOLD'];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      activeCases, upcomingHearings, highRiskCases, exposureAgg,
      categoryStats, recentCases, allSince,
    ] = await Promise.all([
      prisma.litigationCase.count({ where: { status: { in: OPEN_STATUSES } } }),
      prisma.litigationHearing.count({ where: { scheduledAt: { gte: now, lte: thirtyDaysFromNow }, status: 'SCHEDULED' } }),
      prisma.litigationCase.count({ where: { riskLevel: { in: ['HIGH', 'CRITICAL'] }, status: { in: OPEN_STATUSES } } }),
      prisma.litigationCase.aggregate({
        _sum: { exposureAmount: true },
        where: { status: { in: OPEN_STATUSES } },
      }),
      prisma.litigationCase.groupBy({ by: ['category'], _count: { id: true } }),
      prisma.litigationHearing.findMany({
        where: { scheduledAt: { gte: now } },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
        include: { case: { select: { id: true, caseNumber: true, title: true, court: true } } },
      }),
      prisma.litigationCase.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
    ]);

    const monthly: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      monthly[`${d.getFullYear()}-${d.getMonth()}`] = 0;
    }
    for (const c of allSince) {
      const d = new Date(c.createdAt.getFullYear(), c.createdAt.getMonth(), 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in monthly) monthly[key] += 1;
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trends = Object.entries(monthly).map(([key, count]) => {
      const [, month] = key.split('-').map(Number);
      return { month: monthNames[month], count };
    });

    return NextResponse.json({
      summary: {
        activeCases,
        upcomingHearings,
        highRiskCases,
        totalExposure: Number(exposureAgg._sum.exposureAmount ?? 0),
      },
      categories: categoryStats.map((c) => ({ category: c.category, count: c._count.id })),
      trends,
      upcomingHearingsList: recentCases,
    });
  } catch (error) {
    console.error('Failed to fetch litigation stats:', error);
    return NextResponse.json({ error: 'Failed to fetch litigation stats' }, { status: 500 });
  }
}
