import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [
      total, draft, review, pendingApproval,
      approved, executed, active, expiring, expired, archived,
      categoryStats
    ] = await Promise.all([
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'DRAFT' } }),
      prisma.contract.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.contract.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.contract.count({ where: { status: 'APPROVED' } }),
      prisma.contract.count({ where: { status: 'EXECUTED' } }),
      prisma.contract.count({ where: { status: 'ACTIVE' } }),
      prisma.contract.count({ where: { status: 'EXPIRING_SOON' } }),
      prisma.contract.count({ where: { status: 'EXPIRED' } }),
      prisma.contract.count({ where: { status: 'TERMINATED' } }),
      prisma.contract.groupBy({
        by: ['category'],
        _count: { id: true }
      })
    ]);

    return NextResponse.json({
      summary: {
        total, draft, review, pendingApproval,
        approved, executed, active, expiring, expired, archived
      },
      categories: categoryStats.map(c => ({
        category: c.category,
        count: c._count.id
      }))
    });
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
