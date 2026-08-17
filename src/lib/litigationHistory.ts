import prisma from '@/lib/prisma';

interface LogParams {
  caseId: string;
  actorId: string;
  action: string;
  description: string;
  fromValue?: string | null;
  toValue?: string | null;
}

/** Writes to the LitigationHistory feed for a single case mutation. */
export async function logLitigationActivity({ caseId, actorId, action, description, fromValue, toValue }: LogParams) {
  await prisma.litigationHistory.create({
    data: {
      caseId,
      actorId,
      action,
      description,
      fromValue: fromValue ?? null,
      toValue: toValue ?? null,
    },
  });
}
