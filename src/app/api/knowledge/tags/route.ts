import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const tags = await prisma.knowledgeTag.findMany({
    where: q ? { name: { contains: q, mode: 'insensitive' } } : undefined,
    orderBy: { name: 'asc' },
    take: 10,
  });
  return NextResponse.json({ data: tags });
}
