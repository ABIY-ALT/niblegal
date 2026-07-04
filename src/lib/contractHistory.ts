import prisma from '@/lib/prisma';
import type { AuditModule } from '@prisma/client';

interface LogParams {
  contractId: string;
  actorId: string;
  action: string;
  description: string;
  fromValue?: string | null;
  toValue?: string | null;
  ipAddress?: string | null;
}

/**
 * Writes both the business-activity feed (ContractHistory, powers the History/
 * Timeline tab) and the formal compliance log (AuditLog, powers the Audit
 * Trail) for a single contract mutation. Mirrors logLegalActivity for LAHD.
 */
export async function logContractActivity({
  contractId,
  actorId,
  action,
  description,
  fromValue,
  toValue,
  ipAddress,
}: LogParams) {
  await Promise.all([
    prisma.contractHistory.create({
      data: {
        contractId,
        actorId,
        action,
        description,
        fromValue: fromValue ?? null,
        toValue: toValue ?? null,
      },
    }),
    prisma.auditLog.create({
      data: {
        module: 'CMS' as AuditModule,
        action,
        details: description,
        userId: actorId,
        contractId,
        ipAddress: ipAddress ?? null,
      },
    }),
  ]);
}
