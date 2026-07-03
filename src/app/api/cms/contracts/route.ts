import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({
      include: {
        requester: { select: { firstName: true, lastName: true } },
        assignee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: contracts });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, counterparty, description, requesterId } = body;

    // Generate unique contract ID (e.g., NIB-CMS-2026-00001)
    const count = await prisma.contract.count();
    const contractNumber = `NIB-CMS-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const contract = await prisma.contract.create({
      data: {
        contractNumber,
        title,
        category,
        counterparty,
        description,
        requesterId, // In production, get this from JWT session
        status: 'DRAFT',
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        module: 'CMS',
        action: 'CREATED',
        details: `Contract ${contractNumber} created in Draft status`,
        userId: requesterId,
        contractId: contract.id,
      },
    });

    return NextResponse.json({ success: true, data: contract }, { status: 201 });
  } catch (error) {
    console.error('Error creating contract:', error);
    return NextResponse.json({ success: false, error: 'Failed to create contract' }, { status: 500 });
  }
}
