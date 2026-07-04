import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { KnowledgeCategoryOption } from '@/types/knowledge';

export async function GET() {
  const categories = await prisma.knowledgeCategory.findMany({
    where: { isActive: true },
    include: { _count: { select: { documents: true } } },
    orderBy: { name: 'asc' },
  });

  const byId = new Map<string, KnowledgeCategoryOption>();
  for (const c of categories) {
    byId.set(c.id, {
      id: c.id,
      name: c.name,
      code: c.code,
      icon: c.icon,
      parentId: c.parentId,
      documentCount: c._count.documents,
      children: [],
    });
  }

  const roots: KnowledgeCategoryOption[] = [];
  for (const c of byId.values()) {
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children!.push(c);
    } else {
      roots.push(c);
    }
  }

  return NextResponse.json({ data: roots, flat: Array.from(byId.values()) });
}
