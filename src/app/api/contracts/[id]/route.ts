import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        requester: { select: { firstName: true, lastName: true, department: true } },
        assignee: { select: { firstName: true, lastName: true } },
        versions: { orderBy: { version: 'desc' } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: { author: { select: { firstName: true, lastName: true } } }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { firstName: true, lastName: true } } }
        }
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error('Failed to fetch contract:', error);
    return NextResponse.json({ error: 'Failed to fetch contract' }, { status: 500 });
  }
}
