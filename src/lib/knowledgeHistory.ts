import prisma from '@/lib/prisma';
import type { AuditModule } from '@prisma/client';

interface LogParams {
  documentId: string;
  actorId: string;
  action: string;
  description: string;
  fromValue?: string | null;
  toValue?: string | null;
  ipAddress?: string | null;
}

/**
 * Writes both the business-activity feed (KnowledgeHistory, powers the
 * History tab) and the formal compliance log (AuditLog, powers the Audit
 * Trail tab) for a single mutation.
 */
export async function logKnowledgeActivity({
  documentId,
  actorId,
  action,
  description,
  fromValue,
  toValue,
  ipAddress,
}: LogParams) {
  await Promise.all([
    prisma.knowledgeHistory.create({
      data: {
        documentId,
        actorId,
        action,
        description,
        fromValue: fromValue ?? null,
        toValue: toValue ?? null,
      },
    }),
    prisma.auditLog.create({
      data: {
        module: 'KNOWLEDGE' as AuditModule,
        action,
        details: description,
        userId: actorId,
        knowledgeDocumentId: documentId,
        ipAddress: ipAddress ?? null,
      },
    }),
  ]);
}
