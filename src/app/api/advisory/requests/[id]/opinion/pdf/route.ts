import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateOpinionPdf } from '@/lib/export/pdf';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const legalRequest = await prisma.legalRequest.findUnique({
    where: { id },
    include: { opinion: true, category: true, requestingDepartment: true },
  });
  if (!legalRequest || !legalRequest.opinion) {
    return NextResponse.json({ error: 'No opinion available' }, { status: 404 });
  }

  const buffer = generateOpinionPdf({
    requestNumber: legalRequest.requestNumber,
    subject: legalRequest.subject,
    requestingDepartment: legalRequest.requestingDepartment.name,
    category: legalRequest.category.name,
    content: legalRequest.opinion.content,
    signedBy: legalRequest.opinion.digitallySignedBy,
    signedAt: legalRequest.opinion.digitallySignedAt,
    referenceNumber: legalRequest.opinion.referenceNumber,
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${legalRequest.requestNumber}-opinion.pdf"`,
    },
  });
}
