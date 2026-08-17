import prisma from '@/lib/prisma';
import { highestSequence, formatSequence } from '@/lib/sequence';

/**
 * Knowledge document identifier, e.g. DOC-2026-000001.
 * Per-year sequence derived from the highest issued number (see lib/sequence).
 */
export async function generateDocumentNumber(): Promise<string> {
  const prefix = `DOC-${new Date().getFullYear()}-`;
  const rows = await prisma.knowledgeDocument.findMany({
    where: { documentNumber: { startsWith: prefix } },
    select: { documentNumber: true },
  });
  const next = highestSequence(rows.map((r) => r.documentNumber), prefix) + 1;
  return formatSequence(prefix, next, 6);
}
