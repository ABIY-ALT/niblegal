import prisma from '@/lib/prisma';
import type { KnowledgeStatus } from '@prisma/client';

/**
 * Knowledge documents don't have a dedicated workflow-stage table — status
 * transitions are captured by KnowledgeHistory (via logKnowledgeActivity)
 * and formal decisions by KnowledgeApproval. This just updates the status.
 */
export async function transitionKnowledgeStage(documentId: string, newStatus: KnowledgeStatus) {
  return prisma.knowledgeDocument.update({
    where: { id: documentId },
    data: { status: newStatus },
  });
}
