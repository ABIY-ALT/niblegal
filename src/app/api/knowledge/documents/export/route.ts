import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { buildKnowledgeDocumentWhere } from '@/lib/knowledgeQuery';
import { generateListPdf } from '@/lib/export/pdf';
import { generateListExcel } from '@/lib/export/excel';

const EXPORT_INCLUDE = {
  category: { select: { name: true } },
  author: { select: { firstName: true, lastName: true } },
};

const COLUMNS = ['Document ID', 'Title', 'Category', 'Owner', 'Version', 'Status', 'Created Date', 'Updated Date', 'Downloads'];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') === 'xlsx' ? 'xlsx' : 'pdf';
    const where = buildKnowledgeDocumentWhere(searchParams);

    const docs = await prisma.knowledgeDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: EXPORT_INCLUDE,
      take: 1000,
    });

    const rows = docs.map((d) => [
      d.documentNumber,
      d.title,
      d.category.name,
      `${d.author.firstName} ${d.author.lastName}`,
      `v${d.currentVersion}`,
      d.status,
      d.createdAt.toLocaleDateString(),
      d.updatedAt.toLocaleDateString(),
      d.downloads,
    ]);

    if (format === 'xlsx') {
      const buffer = await generateListExcel('Knowledge Documents', COLUMNS, rows);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="knowledge-documents.xlsx"',
        },
      });
    }

    const buffer = generateListPdf('Knowledge Repository — Documents', COLUMNS, rows.map((r) => r.map(String)));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="knowledge-documents.pdf"',
      },
    });
  } catch (error) {
    console.error('Failed to export knowledge documents:', error);
    return NextResponse.json({ error: 'Failed to export documents' }, { status: 500 });
  }
}
