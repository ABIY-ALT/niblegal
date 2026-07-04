import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const LIST_INCLUDE = {
  category: { select: { id: true, name: true } },
  tags: { select: { id: true, name: true } },
  author: { select: { id: true, firstName: true, lastName: true, email: true } },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;

    const q = searchParams.get('q');
    const tag = searchParams.get('tag');
    const categoryId = searchParams.get('categoryId');
    const authorId = searchParams.get('authorId');
    const departmentId = searchParams.get('departmentId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const and: Record<string, unknown>[] = [];

    if (q) {
      and.push({
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { keywords: { has: q } },
          { lawName: { contains: q, mode: 'insensitive' } },
          { articleNumber: { contains: q, mode: 'insensitive' } },
          { documentNumber: { contains: q, mode: 'insensitive' } },
          { relatedContract: { contractNumber: { contains: q, mode: 'insensitive' } } },
          { relatedLegalRequest: { requestNumber: { contains: q, mode: 'insensitive' } } },
        ],
      });
    }
    if (tag) and.push({ tags: { some: { name: { equals: tag, mode: 'insensitive' } } } });
    if (categoryId) and.push({ categoryId });
    if (authorId) and.push({ authorId });
    if (departmentId) and.push({ relatedDepartmentId: departmentId });
    if (dateFrom || dateTo) {
      const range: Record<string, Date> = {};
      if (dateFrom) range.gte = new Date(dateFrom);
      if (dateTo) range.lte = new Date(dateTo);
      and.push({ createdAt: range });
    }

    const where = and.length > 0 ? { AND: and } : {};

    const [data, total] = await Promise.all([
      prisma.knowledgeDocument.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: LIST_INCLUDE }),
      prisma.knowledgeDocument.count({ where }),
    ]);

    return NextResponse.json({
      data,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('Failed to search knowledge documents:', error);
    return NextResponse.json({ error: 'Failed to search knowledge documents' }, { status: 500 });
  }
}
