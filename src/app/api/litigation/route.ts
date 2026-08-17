import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { litigationCaseSchema } from '@/lib/validations/litigation';
import { generateCaseNumber } from '@/lib/litigationNumber';
import { withUniqueRetry } from '@/lib/sequence';
import { logLitigationActivity } from '@/lib/litigationHistory';
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
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const skip = (page - 1) * limit;

    const where: Prisma.LitigationCaseWhereInput = {};
    if (status && status !== 'all') where.status = status as Prisma.LitigationCaseWhereInput['status'];
    if (category && category !== 'all') where.category = category as Prisma.LitigationCaseWhereInput['category'];
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { opposingParty: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (scope === 'mine' || user.role === 'requesting_organ') {
      where.OR = [
        { createdById: user.id },
        ...(user.departmentId ? [{ requestingDepartmentId: user.departmentId }] : []),
      ];
    } else if (scope === 'assigned') {
      where.assignedOfficerId = user.id;
    }

    const [cases, total] = await Promise.all([
      prisma.litigationCase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedOfficer: { select: { firstName: true, lastName: true } },
          requestingDepartment: { select: { name: true } },
          hearings: { orderBy: { scheduledAt: 'asc' }, where: { scheduledAt: { gte: new Date() } }, take: 1 },
        },
      }),
      prisma.litigationCase.count({ where }),
    ]);

    return NextResponse.json({
      data: cases,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Failed to fetch litigation cases:', error);
    return NextResponse.json({ error: 'Failed to fetch litigation cases' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['manager', 'legal_officer', 'admin_assistant'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validated = litigationCaseSchema.parse(body);
    const { requestingDepartmentId, assignedOfficerId, ...rest } = validated;

    const created = await withUniqueRetry(async () =>
      prisma.litigationCase.create({
        data: {
          ...rest,
          caseNumber: await generateCaseNumber(),
          createdById: user.id,
          assignedOfficerId: assignedOfficerId ?? null,
          requestingDepartmentId: requestingDepartmentId ?? user.departmentId ?? null,
        },
      }),
    );
    const caseNumber = created.caseNumber;

    await logLitigationActivity({
      caseId: created.id,
      actorId: user.id,
      action: 'CREATED',
      description: `Case ${caseNumber} filed by ${user.name}`,
      toValue: created.status,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to create litigation case:', error);
    return NextResponse.json({ error: 'Validation or server error' }, { status: 400 });
  }
}
