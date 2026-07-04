import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const categories = await prisma.legalRequestCategory.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true, defaultSlaHours: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ data: categories });
}
