import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { logLegalActivity } from '@/lib/advisoryHistory';
import { transitionStage } from '@/lib/workflow';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin_assistant', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.legalRequest.findUnique({ where: { id }, include: { opinion: true } });
    if (!existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (existing.status !== 'DISPATCHED') {
      return NextResponse.json({ error: `Cannot close a request in ${existing.status} status` }, { status: 400 });
    }

    const now = new Date();
    const updated = await prisma.legalRequest.update({
      where: { id },
      data: { status: 'ARCHIVED', closedAt: now, archivedAt: now },
    });
    await transitionStage(id, 'CLOSED', user.id);
    await transitionStage(id, 'ARCHIVED', user.id);

    await logLegalActivity({
      legalRequestId: id,
      actorId: user.id,
      action: 'CLOSED',
      description: `Request closed by ${user.name}`,
      fromValue: 'DISPATCHED',
      toValue: 'CLOSED',
    });

    if (existing.opinion) {
      const category = await prisma.knowledgeCategory.upsert({
        where: { name: 'Legal Opinions' },
        update: {},
        create: { name: 'Legal Opinions', description: 'Archived legal opinions from the Legal Advisory Help Desk' },
      });
      const count = await prisma.knowledgeDocument.count();
      const documentNumber = `DOC-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

      await prisma.knowledgeDocument.create({
        data: {
          documentNumber,
          title: existing.subject,
          description: existing.description,
          status: 'PUBLISHED',
          confidentiality: existing.confidentiality,
          categoryId: category.id,
          relatedRequestId: existing.id,
          relatedContractId: existing.relatedContractId,
          authorId: user.id,
        },
      });

      await logLegalActivity({
        legalRequestId: id,
        actorId: user.id,
        action: 'ARCHIVED',
        description: `Legal opinion archived to Knowledge Repository as ${documentNumber}`,
        toValue: 'ARCHIVED',
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to close request:', error);
    return NextResponse.json({ error: 'Failed to close request' }, { status: 500 });
  }
}
