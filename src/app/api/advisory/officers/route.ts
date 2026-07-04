import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Legal Officers + Managers are eligible assignees/reviewers/approvers.
export async function GET() {
  const officers = await prisma.user.findMany({
    where: { isActive: true, role: { name: { in: ['Legal Officer', 'Manager'] } } },
    select: { id: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } },
    orderBy: [{ firstName: 'asc' }],
  });
  return NextResponse.json({ data: officers });
}
