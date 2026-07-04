import prisma from '@/lib/prisma';
import type { AuditModule } from '@prisma/client';

interface LogParams {
  legalRequestId: string;
  actorId: string;
  action: string;
  description: string;
  fromValue?: string | null;
  toValue?: string | null;
  ipAddress?: string | null;
}

/**
 * Writes both the business-activity feed (LegalHistory, powers the History/
 * Timeline tabs) and the formal compliance log (AuditLog, powers the Audit
 * Trail tab) for a single mutation.
 */
export async function logLegalActivity({
  legalRequestId,
  actorId,
  action,
  description,
  fromValue,
  toValue,
  ipAddress,
}: LogParams) {
  await Promise.all([
    prisma.legalHistory.create({
      data: {
        legalRequestId,
        actorId,
        action,
        description,
        fromValue: fromValue ?? null,
        toValue: toValue ?? null,
      },
    }),
    prisma.auditLog.create({
      data: {
        module: 'LAHD' as AuditModule,
        action,
        details: description,
        userId: actorId,
        legalRequestId,
        ipAddress: ipAddress ?? null,
      },
    }),
  ]);
}
