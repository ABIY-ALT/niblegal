import prisma from '@/lib/prisma';
import type { Priority } from '@prisma/client';

const FALLBACK_SLA_HOURS: Record<Priority, number> = {
  CRITICAL: 24,
  URGENT: 36,
  HIGH: 48,
  MEDIUM: 72,
  LOW: 120,
};

export async function resolveSlaHours(priority: Priority, categoryId?: string | null): Promise<number> {
  if (categoryId) {
    const specific = await prisma.slaRule.findFirst({ where: { categoryId, priority } });
    if (specific) return specific.slaHours;
  }
  const general = await prisma.slaRule.findFirst({ where: { categoryId: null, priority } });
  if (general) return general.slaHours;
  return FALLBACK_SLA_HOURS[priority];
}
