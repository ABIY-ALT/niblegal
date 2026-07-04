import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

const USER_SELECT = { id: true, firstName: true, lastName: true, email: true };

const DETAIL_INCLUDE = {
  category: { select: { id: true, name: true } },
  tags: { select: { id: true, name: true } },
  author: { select: USER_SELECT },
  relatedContract: { select: { id: true, contractNumber: true, title: true } },
  relatedLegalRequest: { select: { id: true, requestNumber: true, subject: true } },
  relatedDepartment: { select: { id: true, name: true } },
  relatedDocuments: { select: { id: true, documentNumber: true, title: true, status: true } },
  versions: {
    orderBy: { versionNumber: 'desc' as const },
    include: { uploadedBy: { select: USER_SELECT }, approvedBy: { select: USER_SELECT } },
  },
  attachments: { orderBy: { createdAt: 'desc' as const }, include: { uploadedBy: { select: USER_SELECT } } },
  comments: { orderBy: { createdAt: 'desc' as const }, include: { author: { select: USER_SELECT } } },
  bookmarks: { select: { id: true, userId: true, isPinned: true } },
  downloadLogs: { orderBy: { createdAt: 'desc' as const }, include: { user: { select: USER_SELECT } } },
  history: { orderBy: { createdAt: 'desc' as const }, include: { actor: { select: USER_SELECT } } },
  approvals: { orderBy: { decidedAt: 'desc' as const }, include: { approver: { select: USER_SELECT } } },
  auditLogs: { orderBy: { createdAt: 'desc' as const }, include: { user: { select: USER_SELECT } } },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const doc = await prisma.knowledgeDocument.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    return NextResponse.json({ data: doc });
  } catch (error) {
    console.error('Failed to fetch knowledge document:', error);
    return NextResponse.json({ error: 'Failed to fetch knowledge document' }, { status: 500 });
  }
}

// Hard delete — Archive page, admin-only, archived documents only.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin_assistant') {
      return NextResponse.json({ error: 'Only an administrator can delete a document' }, { status: 403 });
    }

    const existing = await prisma.knowledgeDocument.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    if (existing.status !== 'ARCHIVED') {
      return NextResponse.json({ error: 'Only archived documents can be deleted' }, { status: 400 });
    }

    await prisma.knowledgeDocument.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete knowledge document:', error);
    return NextResponse.json({ error: 'Failed to delete knowledge document' }, { status: 500 });
  }
}
