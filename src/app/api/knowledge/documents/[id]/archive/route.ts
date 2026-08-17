import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasAccess } from '@/lib/access';
import { logKnowledgeActivity } from '@/lib/knowledgeHistory';
import { transitionKnowledgeStage } from '@/lib/knowledgeWorkflow';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!hasAccess(user, { permission: 'knowledge.approve', roles: ['admin_assistant', 'manager'] })) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (!['PUBLISHED', 'EXPIRED'].includes(existing.status)) {
      return NextResponse.json({ error: `Cannot archive a document in ${existing.status} status` }, { status: 400 });
    }

    const updated = await transitionKnowledgeStage(id, 'ARCHIVED');
    await logKnowledgeActivity({
      documentId: id,
      actorId: user.id,
      action: 'ARCHIVED',
      description: `Document ${existing.documentNumber} archived by ${user.name}`,
      fromValue: existing.status,
      toValue: 'ARCHIVED',
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Failed to archive document:', error);
    return NextResponse.json({ error: 'Failed to archive document' }, { status: 500 });
  }
}
