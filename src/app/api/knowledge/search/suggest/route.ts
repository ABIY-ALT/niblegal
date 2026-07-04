import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  if (!q) return NextResponse.json({ data: [] });

  const docs = await prisma.knowledgeDocument.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { documentNumber: { contains: q, mode: 'insensitive' } },
        { keywords: { has: q } },
      ],
    },
    select: { id: true, title: true, documentNumber: true },
    take: 5,
  });

  return NextResponse.json({ data: docs });
}
