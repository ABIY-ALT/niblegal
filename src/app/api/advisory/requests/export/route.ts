import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildLegalRequestWhere } from '@/lib/advisoryQuery';
import { generateListPdf } from '@/lib/export/pdf';
import { generateListExcel } from '@/lib/export/excel';

const EXPORT_INCLUDE = {
  category: { select: { name: true } },
  requestingDepartment: { select: { name: true } },
  requester: { select: { firstName: true, lastName: true } },
  assignee: { select: { firstName: true, lastName: true } },
};

const COLUMNS = [
  'Request ID', 'Subject', 'Category', 'Department', 'Requested By',
  'Assigned Officer', 'Priority', 'Status', 'Date Submitted', 'Due Date',
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') === 'xlsx' ? 'xlsx' : 'pdf';
    const where = buildLegalRequestWhere(searchParams);

    const requests = await prisma.legalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: EXPORT_INCLUDE,
      take: 1000,
    });

    const rows = requests.map((r) => [
      r.requestNumber,
      r.subject,
      r.category.name,
      r.requestingDepartment.name,
      `${r.requester.firstName} ${r.requester.lastName}`,
      r.assignee ? `${r.assignee.firstName} ${r.assignee.lastName}` : 'Unassigned',
      r.priority,
      r.status,
      r.createdAt.toLocaleDateString(),
      r.dueDate ? r.dueDate.toLocaleDateString() : '-',
    ]);

    if (format === 'xlsx') {
      const buffer = await generateListExcel('Legal Requests', COLUMNS, rows);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="legal-requests.xlsx"',
        },
      });
    }

    const buffer = generateListPdf('Legal Advisory Requests', COLUMNS, rows);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="legal-requests.pdf"',
      },
    });
  } catch (error) {
    console.error('Failed to export legal requests:', error);
    return NextResponse.json({ error: 'Failed to export requests' }, { status: 500 });
  }
}
