import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import prisma from '@/lib/prisma';

const TERMINAL_STATUSES = ['CLOSED', 'ARCHIVED', 'REJECTED'] as const;

export async function GET() {
  try {
    const [
      total,
      newCount,
      assignedCount,
      draftingCount,
      reviewCount,
      pendingApprovalCount,
      closedCount,
      overdueCount,
      slaBreachedCount,
      byDepartmentRaw,
      byCategoryRaw,
      recentForTrend,
      criticalRequests,
      upcomingDeadlines,
      recentHistory,
      officerWorkloadRaw,
    ] = await Promise.all([
      prisma.legalRequest.count(),
      prisma.legalRequest.count({ where: { status: 'SUBMITTED' } }),
      prisma.legalRequest.count({ where: { status: 'ASSIGNED' } }),
      prisma.legalRequest.count({ where: { status: 'DRAFTING' } }),
      prisma.legalRequest.count({ where: { status: 'REVIEW' } }),
      prisma.legalRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.legalRequest.count({ where: { status: { in: [...TERMINAL_STATUSES] } } }),
      prisma.legalRequest.count({ where: { status: { notIn: [...TERMINAL_STATUSES] }, slaDeadline: { lt: new Date() } } }),
      prisma.legalRequest.count({ where: { slaBreached: true } }),
      prisma.legalRequest.groupBy({ by: ['requestingDepartmentId'], _count: true }),
      prisma.legalRequest.groupBy({ by: ['categoryId'], _count: true }),
      prisma.legalRequest.findMany({ select: { createdAt: true }, orderBy: { createdAt: 'desc' }, take: 500 }),
      prisma.legalRequest.findMany({
        where: { priority: { in: ['CRITICAL', 'URGENT'] }, status: { notIn: [...TERMINAL_STATUSES] } },
        orderBy: { slaDeadline: 'asc' },
        take: 5,
        select: { id: true, requestNumber: true, subject: true, priority: true, slaDeadline: true, status: true },
      }),
      prisma.legalRequest.findMany({
        where: { status: { notIn: [...TERMINAL_STATUSES] } },
        orderBy: { slaDeadline: 'asc' },
        take: 5,
        select: { id: true, requestNumber: true, subject: true, slaDeadline: true, status: true },
      }),
      prisma.legalHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { actor: { select: { firstName: true, lastName: true } }, legalRequest: { select: { requestNumber: true, id: true } } },
      }),
      prisma.legalRequest.groupBy({
        by: ['assigneeId'],
        _count: true,
        where: { assigneeId: { not: null }, status: { notIn: [...TERMINAL_STATUSES] } },
      }),
    ]);

    const slaMetCount = closedCount - slaBreachedCount > 0 ? closedCount - slaBreachedCount : 0;

    const departments = await prisma.department.findMany({
      where: { id: { in: byDepartmentRaw.map((d) => d.requestingDepartmentId) } },
    });
    const byDepartment = byDepartmentRaw.map((d) => ({
      name: departments.find((x) => x.id === d.requestingDepartmentId)?.name ?? 'Unknown',
      count: d._count,
    }));

    const categories = await prisma.legalRequestCategory.findMany({
      where: { id: { in: byCategoryRaw.map((c) => c.categoryId) } },
    });
    const byCategory = byCategoryRaw.map((c) => ({
      name: categories.find((x) => x.id === c.categoryId)?.name ?? 'Unknown',
      count: c._count,
    }));

    const officerIds = officerWorkloadRaw.map((o) => o.assigneeId).filter((v): v is string => !!v);
    const officerUsers = await prisma.user.findMany({ where: { id: { in: officerIds } } });
    const officerWorkload = officerWorkloadRaw.map((o) => {
      const u = officerUsers.find((x) => x.id === o.assigneeId);
      return { name: u ? `${u.firstName} ${u.lastName}` : 'Unknown', count: o._count };
    });

    const monthCounts = new Map<string, number>();
    for (const r of recentForTrend) {
      const key = format(r.createdAt, 'yyyy-MM');
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }
    const monthlyTrends = Array.from(monthCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, count]) => ({ month, count }));

    return NextResponse.json({
      summary: {
        total,
        newRequests: newCount,
        assigned: assignedCount,
        drafting: draftingCount,
        pendingReview: reviewCount,
        pendingApproval: pendingApprovalCount,
        closed: closedCount,
        overdue: overdueCount,
        slaMet: slaMetCount,
        slaBreached: slaBreachedCount,
      },
      byDepartment,
      byCategory,
      monthlyTrends,
      criticalRequests,
      upcomingDeadlines,
      recentHistory,
      officerWorkload,
    });
  } catch (error) {
    console.error('Failed to compute advisory stats:', error);
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 });
  }
}
