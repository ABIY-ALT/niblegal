import prisma from '@/lib/prisma';
import { highestSequence, formatSequence } from '@/lib/sequence';

const WIDTH = 5;

/**
 * Auto-generated unique contract identifier, e.g. NIB-CMS-2026-00042 (BR-CMS-03).
 *
 * Derived from the highest number already issued *this year* rather than a row
 * count, so the sequence restarts each January and a deleted contract cannot
 * cause the next one to collide. Pair with `withUniqueRetry` at the call site to
 * absorb the race between two simultaneous creates.
 */
export async function generateContractNumber(): Promise<string> {
  const prefix = `NIB-CMS-${new Date().getFullYear()}-`;
  const rows = await prisma.contract.findMany({
    where: { contractNumber: { startsWith: prefix } },
    select: { contractNumber: true },
  });
  const next = highestSequence(rows.map((r) => r.contractNumber), prefix) + 1;
  return formatSequence(prefix, next, WIDTH);
}
