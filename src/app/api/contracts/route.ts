import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { contractSchema } from '@/lib/validations/contract';
import { generateContractNumber } from '@/lib/contractNumber';
import { withUniqueRetry } from '@/lib/sequence';
import { logContractActivity } from '@/lib/contractHistory';
import { transitionContractStage } from '@/lib/contractWorkflow';
import { notifyContractWorkflow } from '@/lib/notifyContract';
import type { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const scope = searchParams.get('scope'); // 'mine' | 'assigned' | undefined

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;

    const where: Prisma.ContractWhereInput = {};
    if (status && status !== 'all') where.status = status as Prisma.ContractWhereInput['status'];
    if (category && category !== 'all') where.category = category as Prisma.ContractWhereInput['category'];
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { counterparty: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Requesting organs only see their own / their department's contracts.
    if (scope === 'mine' || user.role === 'requesting_organ') {
      where.OR = [
        { requesterId: user.id },
        ...(user.departmentId ? [{ requestingDepartmentId: user.departmentId }] : []),
      ];
    } else if (scope === 'assigned') {
      where.assigneeId = user.id;
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { firstName: true, lastName: true } },
          assignee: { select: { firstName: true, lastName: true } },
          requestingDepartment: { select: { name: true } },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    return NextResponse.json({
      data: contracts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Failed to fetch contracts:', error);
    return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = contractSchema.parse(body);
    const { requestingDepartmentId, ...rest } = validated;

    // Number generation + insert are retried together: if a simultaneous create
    // claims the same number first, the unique index rejects this insert and the
    // retry regenerates against the new highest value.
    const contract = await withUniqueRetry(async () =>
      prisma.contract.create({
        data: {
          ...rest,
          contractNumber: await generateContractNumber(),
          status: 'DRAFT',
          requesterId: user.id,
          requestingDepartmentId: requestingDepartmentId ?? user.departmentId ?? null,
        },
      }),
    );

    await transitionContractStage(contract.id, 'DRAFT', user.id, 'Contract request created');
    await logContractActivity({
      contractId: contract.id,
      actorId: user.id,
      action: 'CREATED',
      description: `Contract request ${contract.contractNumber} created by ${user.name}`,
      toValue: 'DRAFT',
    });

    // Alert the legal team that a new request awaits drafting/assignment.
    await notifyContractWorkflow({
      contractId: contract.id,
      title: 'New contract request',
      body: `${contract.contractNumber} — ${contract.title}`,
      type: 'INFO',
      actorId: user.id,
      recipientRoles: ['Manager', 'Legal Officer'],
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Failed to create contract:', error);
    return NextResponse.json({ error: 'Validation or server error' }, { status: 400 });
  }
}
