import prisma from '@/lib/prisma';

export async function generateDocumentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.knowledgeDocument.count();
  return `DOC-${year}-${String(count + 1).padStart(6, '0')}`;
}
