import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { legalRequestSchema } from '@/lib/validations/advisory';
import { generateRequestNumber } from '@/lib/requestNumber';
import { withUniqueRetry } from '@/lib/sequence';
import { calculateDeadline } from '@/lib/sla';
import { resolveSlaHours } from '@/lib/slaRules';
import { logLegalActivity } from '@/lib/advisoryHistory';
import { buildLegalRequestWhere } from '@/lib/advisoryQuery';

const LIST_INCLUDE = {
  category: { select: { id: true, name: true } },
  requestingDepartment: { select: { id: true, name: true } },
  requester: { select: { id: true, firstName: true, lastName: true, email: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const skip = (page - 1) * limit;

    const where = buildLegalRequestWhere(searchParams);

    const [data, total] = await Promise.all([
      prisma.legalRequest.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: LIST_INCLUDE }),
      prisma.legalRequest.count({ where }),
    ]);

    return NextResponse.json({
      data,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('Failed to fetch legal requests:', error);
    return NextResponse.json({ error: 'Failed to fetch legal requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const submit = body.submit === true; // true = Submit Request, false/absent = Save Draft
    const validated = legalRequestSchema.parse(body);

    const slaHours = await resolveSlaHours(validated.priority, validated.categoryId);
    const slaDeadline = calculateDeadline(slaHours);
    const status = submit ? 'SUBMITTED' : 'DRAFT';

    // Generation + insert retried together so a concurrent create cannot leave
    // this request holding a number that was just taken.
    const legalRequest = await withUniqueRetry(async () =>
      prisma.legalRequest.create({
      data: {
        requestNumber: await generateRequestNumber(),
        subject: validated.subject,
        description: validated.description,
        requestType: validated.requestType,
        categoryId: validated.categoryId,
        requestingDepartmentId: validated.requestingDepartmentId,
        priority: validated.priority,
        confidentiality: validated.confidentiality,
        relatedContractId: validated.relatedContractId || null,
        dueDate: validated.dueDate ?? null,
        tags: validated.tags,
        requesterId: user.id,
        status,
        slaHours,
        slaDeadline,
      },
      include: LIST_INCLUDE,
      }),
    );

    await prisma.legalWorkflow.create({
      data: { legalRequestId: legalRequest.id, stage: status, actorId: user.id },
    });

    await logLegalActivity({
      legalRequestId: legalRequest.id,
      actorId: user.id,
      action: submit ? 'SUBMITTED' : 'CREATED',
      description: submit
        ? `Request ${legalRequest.requestNumber} submitted by ${user.name}`
        : `Request ${legalRequest.requestNumber} saved as draft by ${user.name}`,
    });

    return NextResponse.json({ data: legalRequest }, { status: 201 });
  } catch (error) {
    console.error('Failed to create legal request:', error);
    return NextResponse.json({ error: 'Validation or server error' }, { status: 400 });
  }
}
