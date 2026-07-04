import prisma from '@/lib/prisma';
import type { ContractStatus } from '@prisma/client';

/**
 * Closes the current open workflow stage and opens a new one, giving contracts
 * the same stage-timeline as LAHD's transitionStage.
 */
export async function transitionContractStage(
  contractId: string,
  newStage: ContractStatus,
  actorId: string,
  notes?: string,
) {
  await prisma.contractWorkflow.updateMany({
    where: { contractId, exitedAt: null },
    data: { exitedAt: new Date() },
  });
  await prisma.contractWorkflow.create({
    data: { contractId, stage: newStage, actorId, notes },
  });
}
