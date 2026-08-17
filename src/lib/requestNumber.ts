import prisma from '@/lib/prisma';
import { highestSequence, formatSequence } from '@/lib/sequence';

/**
 * Advisory request identifier, e.g. LEG-2026-000001.
 * Per-year sequence derived from the highest issued number (see lib/sequence).
 */
export async function generateRequestNumber(): Promise<string> {
  const prefix = `LEG-${new Date().getFullYear()}-`;
  const rows = await prisma.legalRequest.findMany({
    where: { requestNumber: { startsWith: prefix } },
    select: { requestNumber: true },
  });
  const next = highestSequence(rows.map((r) => r.requestNumber), prefix) + 1;
  return formatSequence(prefix, next, 6);
}

/** Legal opinion reference, e.g. NIB-LGL-REF-2026-00001. */
export async function generateReferenceNumber(): Promise<string> {
  const prefix = `NIB-LGL-REF-${new Date().getFullYear()}-`;
  const rows = await prisma.legalOpinion.findMany({
    where: { referenceNumber: { startsWith: prefix } },
    select: { referenceNumber: true },
  });
  const next = highestSequence(
    rows.map((r) => r.referenceNumber).filter((v): v is string => !!v),
    prefix,
  ) + 1;
  return formatSequence(prefix, next, 5);
}
