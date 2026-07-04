import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const USER_SELECT = { id: true, firstName: true, lastName: true, email: true };

const DETAIL_INCLUDE = {
  category: { select: { id: true, name: true } },
  requestingDepartment: { select: { id: true, name: true } },
  requester: { select: USER_SELECT },
  assignee: { select: USER_SELECT },
  relatedContract: { select: { id: true, contractNumber: true, title: true } },
  opinion: {
    include: {
      versions: { orderBy: { versionNumber: 'desc' as const }, include: { createdBy: { select: USER_SELECT } } },
    },
  },
  assignments: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      officer: { select: USER_SELECT },
      previousOfficer: { select: USER_SELECT },
      assignedBy: { select: USER_SELECT },
    },
  },
  approvals: {
    orderBy: { decidedAt: 'desc' as const },
    include: { approver: { select: USER_SELECT }, delegatedTo: { select: USER_SELECT } },
  },
  workflowSteps: { orderBy: { enteredAt: 'asc' as const }, include: { actor: { select: USER_SELECT } } },
  comments: { orderBy: { createdAt: 'desc' as const }, include: { author: { select: USER_SELECT } } },
  attachments: { orderBy: { createdAt: 'desc' as const }, include: { uploadedBy: { select: USER_SELECT } } },
  history: { orderBy: { createdAt: 'desc' as const }, include: { actor: { select: USER_SELECT } } },
  auditLogs: { orderBy: { createdAt: 'desc' as const }, include: { user: { select: USER_SELECT } } },
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const legalRequest = await prisma.legalRequest.findUnique({ where: { id }, include: DETAIL_INCLUDE });
    if (!legalRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    return NextResponse.json({ data: legalRequest });
  } catch (error) {
    console.error('Failed to fetch legal request:', error);
    return NextResponse.json({ error: 'Failed to fetch legal request' }, { status: 500 });
  }
}
