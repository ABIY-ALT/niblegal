import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const departments = await prisma.department.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json({ data: departments });
}
