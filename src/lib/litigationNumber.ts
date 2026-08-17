import prisma from '@/lib/prisma';
import { highestSequence, formatSequence } from '@/lib/sequence';

/**
 * Litigation case identifier, e.g. LIT-2026-000042.
 * Per-year sequence derived from the highest issued number (see lib/sequence).
 */
export async function generateCaseNumber(): Promise<string> {
  const prefix = `LIT-${new Date().getFullYear()}-`;
  const rows = await prisma.litigationCase.findMany({
    where: { caseNumber: { startsWith: prefix } },
    select: { caseNumber: true },
  });
  const next = highestSequence(rows.map((r) => r.caseNumber), prefix) + 1;
  return formatSequence(prefix, next, 6);
}
