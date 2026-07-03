import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { contractSchema } from '@/lib/validations/contract';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (category && category !== 'all') where.category = category;

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { firstName: true, lastName: true } },
          assignee: { select: { firstName: true, lastName: true } },
        }
      }),
      prisma.contract.count({ where })
    ]);

    return NextResponse.json({
      data: contracts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = contractSchema.parse(body);

    // Get current user (mocking auth for now based on store)
    // In real app use: const session = await auth(); const userId = session.user.id;
    const adminUser = await prisma.user.findFirst({ where: { email: 'h.tesfaye@nibbank.et' }});
    if (!adminUser) {
      return NextResponse.json({ error: 'No user found' }, { status: 500 });
    }

    // Generate contract number
    const count = await prisma.contract.count();
    const contractNumber = `NIB-CMS-2026-${String(count + 1).padStart(5, '0')}`;

    const contract = await prisma.contract.create({
      data: {
        ...validated,
        contractNumber,
        status: 'DRAFT',
        requesterId: adminUser.id,
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        module: 'CMS',
        action: 'CREATED',
        details: `Contract request ${contractNumber} created`,
        userId: adminUser.id,
        contractId: contract.id,
      }
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Failed to create contract:', error);
    return NextResponse.json({ error: 'Validation or server error' }, { status: 400 });
  }
}
