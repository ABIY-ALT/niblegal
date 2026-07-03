import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [
      total, draft, review, managerApproval, directorApproval,
      approved, executed, expiring, expired, archived,
      categoryStats
    ] = await Promise.all([
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'DRAFT' } }),
      prisma.contract.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.contract.count({ where: { status: 'PENDING_APPROVAL' } }), // manager
      prisma.contract.count({ where: { status: 'PENDING_APPROVAL' } }), // director - simplistic for now
      prisma.contract.count({ where: { status: 'APPROVED' } }),
      prisma.contract.count({ where: { status: 'EXECUTED' } }),
      prisma.contract.count({ where: { status: 'EXPIRING_SOON' } }),
      prisma.contract.count({ where: { status: 'EXPIRED' } }),
      prisma.contract.count({ where: { status: 'TERMINATED' } }), // placeholder for archived
      prisma.contract.groupBy({
        by: ['category'],
        _count: { id: true }
      })
    ]);

    return NextResponse.json({
      summary: {
        total, draft, review, managerApproval, directorApproval,
        approved, executed, expiring, expired, archived
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
