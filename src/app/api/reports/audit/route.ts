import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasAccess } from '@/lib/access';
import type { Prisma } from '@prisma/client';

/** Consolidated audit trail across CMS/LAHD/KNOWLEDGE/SYSTEM (§3.4, BR-CMS-10). */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasAccess(user, { permission: 'reports.view', roles: ['manager', 'legal_officer', 'admin_assistant'] })) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const module = searchParams.get('module');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));

  const where: Prisma.AuditLogWhereInput = {};
  if (module && module !== 'all') where.module = module as Prisma.AuditLogWhereInput['module'];

  const [logs, total, byModule] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { firstName: true, lastName: true } } },
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ['module'], _count: { id: true } }),
  ]);

  return NextResponse.json({
    data: logs.map((l) => ({
      id: l.id,
      module: l.module,
      action: l.action,
      details: l.details,
      user: l.user ? `${l.user.firstName} ${l.user.lastName}` : 'System',
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
    })),
    meta: {
      total, page, limit, totalPages: Math.ceil(total / limit),
      byModule: Object.fromEntries(byModule.map((m) => [m.module, m._count.id])),
    },
  });
}
