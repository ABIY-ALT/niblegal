import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const entries = await prisma.knowledgeHistory.findMany({
    where: { actorId: user.id, action: 'VIEWED' },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: { document: { select: { id: true, documentNumber: true, title: true, status: true } } },
  });

  const seen = new Set<string>();
  const unique = [];
  for (const e of entries) {
    if (seen.has(e.document.id)) continue;
    seen.add(e.document.id);
    unique.push({ ...e.document, viewedAt: e.createdAt });
    if (unique.length >= 5) break;
  }

  return NextResponse.json({ data: unique });
}
