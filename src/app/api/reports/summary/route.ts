import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasAccess } from '@/lib/access';

/**
 * Cross-module reporting aggregation (BR-CMS-09, BR-LAHD-04/06, §3.4). Replaces
 * the mock-store math the report pages used with live DB queries.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasAccess(user, { permission: 'reports.view', roles: ['manager', 'legal_officer', 'admin_assistant'] })) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const terminalAdvisory = ['DISPATCHED', 'CLOSED', 'ARCHIVED'];

  const [
    contractTotal, contractByStatus, contractByCategory, contractByDept,
    contractValue, advisoryTotal, advisoryByStatus, advisoryBreached,
    advisoryClosed, contractAssignees, advisoryAssignees, officers,
    knowledgeTotal, knowledgePublished, turnaroundRows,
  ] = await Promise.all([
    prisma.contract.count(),
    prisma.contract.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.contract.groupBy({ by: ['category'], _count: { id: true } }),
    prisma.contract.groupBy({ by: ['requestingDepartmentId'], _count: { id: true } }),
    prisma.contract.aggregate({ _sum: { value: true } }),
    prisma.legalRequest.count(),
    prisma.legalRequest.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.legalRequest.count({ where: { slaBreached: true } }),
    prisma.legalRequest.count({ where: { status: { in: ['DISPATCHED', 'CLOSED', 'ARCHIVED'] } } }),
    prisma.contract.groupBy({ by: ['assigneeId'], _count: { id: true }, where: { assigneeId: { not: null } } }),
    prisma.legalRequest.groupBy({ by: ['assigneeId'], _count: { id: true }, where: { assigneeId: { not: null } } }),
    prisma.user.findMany({ where: { isActive: true, role: { name: { in: ['Legal Officer', 'Manager'] } } }, select: { id: true, firstName: true, lastName: true } }),
    prisma.knowledgeDocument.count(),
    prisma.knowledgeDocument.count({ where: { status: 'PUBLISHED' } }),
    prisma.legalRequest.findMany({
      where: { status: { in: ['DISPATCHED', 'CLOSED'] } },
      select: { createdAt: true, updatedAt: true },
    }),
  ]);

  const statusMap = (rows: { status: string; _count: { id: number } }[]) =>
    Object.fromEntries(rows.map((r) => [r.status, r._count.id]));

  const cStatus = statusMap(contractByStatus as never);
  const aStatus = statusMap(advisoryByStatus as never);

  const overdue = await prisma.legalRequest.count({
    where: { slaDeadline: { lt: now }, slaMetAt: null, status: { notIn: terminalAdvisory as never } },
  });

  const deptIds = contractByDept.map((d) => d.requestingDepartmentId).filter(Boolean) as string[];
  const depts = await prisma.department.findMany({ where: { id: { in: deptIds } }, select: { id: true, name: true } });
  const deptName = (id: string | null) => depts.find((d) => d.id === id)?.name ?? 'Unassigned';

  const contractByAssignee = Object.fromEntries(contractAssignees.map((r) => [r.assigneeId, r._count.id]));
  const advisoryByAssignee = Object.fromEntries(advisoryAssignees.map((r) => [r.assigneeId, r._count.id]));

  const avgTurnaroundHours = turnaroundRows.length
    ? Math.round(turnaroundRows.reduce((s, r) => s + (r.updatedAt.getTime() - r.createdAt.getTime()) / 3.6e6, 0) / turnaroundRows.length)
    : 0;

  const slaCompliance = advisoryTotal > 0 ? Math.round(((advisoryTotal - advisoryBreached) / advisoryTotal) * 100) : 100;

  // ── Monthly trends (last 6 months) ──────────────────────────────────────
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [contractDates, requestDates, knowledgeDates] = await Promise.all([
    prisma.contract.findMany({ where: { createdAt: { gte: sixMonthsAgo } }, select: { createdAt: true } }),
    prisma.legalRequest.findMany({ where: { createdAt: { gte: sixMonthsAgo } }, select: { createdAt: true } }),
    prisma.knowledgeDocument.findMany({ where: { createdAt: { gte: sixMonthsAgo } }, select: { createdAt: true } }),
  ]);
  const months: { key: string; month: string; contracts: number; advisory: number; knowledge: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString('en', { month: 'short' }), contracts: 0, advisory: 0, knowledge: 0 });
  }
  const bucket = (rows: { createdAt: Date }[], field: 'contracts' | 'advisory' | 'knowledge') => {
    for (const r of rows) {
      const k = `${r.createdAt.getFullYear()}-${r.createdAt.getMonth()}`;
      const m = months.find((x) => x.key === k);
      if (m) m[field]++;
    }
  };
  bucket(contractDates, 'contracts');
  bucket(requestDates, 'advisory');
  bucket(knowledgeDates, 'knowledge');

  return NextResponse.json({
    data: {
      contracts: {
        total: contractTotal,
        byStatus: cStatus,
        byCategory: contractByCategory.map((r) => ({ category: r.category, count: r._count.id })),
        byDepartment: contractByDept.map((r) => ({ name: deptName(r.requestingDepartmentId), count: r._count.id })),
        active: cStatus.ACTIVE ?? 0,
        draft: cStatus.DRAFT ?? 0,
        underReview: cStatus.UNDER_REVIEW ?? 0,
        pendingApproval: cStatus.PENDING_APPROVAL ?? 0,
        executed: (cStatus.EXECUTED ?? 0) + (cStatus.ACTIVE ?? 0),
        expiring: cStatus.EXPIRING_SOON ?? 0,
        expired: cStatus.EXPIRED ?? 0,
        totalValue: Number(contractValue._sum.value ?? 0),
      },
      advisory: {
        total: advisoryTotal,
        byStatus: aStatus,
        pending: advisoryTotal - advisoryClosed,
        closed: advisoryClosed,
        overdue,
        breached: advisoryBreached,
        slaCompliance,
        avgTurnaroundHours,
      },
      officers: officers
        .map((o) => ({
          id: o.id,
          name: `${o.firstName} ${o.lastName}`,
          contracts: contractByAssignee[o.id] ?? 0,
          advisory: advisoryByAssignee[o.id] ?? 0,
        }))
        .sort((a, b) => b.contracts + b.advisory - (a.contracts + a.advisory)),
      knowledge: { total: knowledgeTotal, published: knowledgePublished },
      trends: months.map(({ month, contracts, advisory, knowledge }) => ({ month, contracts, advisory, knowledge })),
    },
  });
}
