import prisma from '@/lib/prisma';
import type { LegalRequestStatus } from '@prisma/client';

export async function transitionStage(
  legalRequestId: string,
  newStage: LegalRequestStatus,
  actorId: string,
  notes?: string,
) {
  await prisma.legalWorkflow.updateMany({
    where: { legalRequestId, exitedAt: null },
    data: { exitedAt: new Date() },
  });
  await prisma.legalWorkflow.create({
    data: { legalRequestId, stage: newStage, actorId, notes },
  });
}
