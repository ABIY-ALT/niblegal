import prisma from '@/lib/prisma';
import { NotificationService } from '@/services/notification.service';

/**
 * Background scan that turns the CMS/LAHD date fields into real alerts
 * (BR-CMS-07 expiry/renewal/SLA, BR-LAHD-04 SLA tracking). Designed to be
 * idempotent: alerts fire only on the transition into a breached/expiring
 * state, so it can be run on any cadence without spamming.
 */
export interface ScanResult {
  contractsExpired: number;
  contractsExpiring: number;
  contractsSlaBreached: number;
  requestsSlaBreached: number;
  ranAt: string;
}

async function staffRecipientIds(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: { isActive: true, role: { name: { in: ['Manager', 'Legal Officer'] } } },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

export async function runSlaScan(): Promise<ScanResult> {
  const now = new Date();
  const staff = await staffRecipientIds();

  const notifyMany = (recipientIds: string[], input: Parameters<typeof NotificationService.broadcast>[0]) => {
    const ids = [...new Set(recipientIds)].filter(Boolean);
    if (ids.length === 0) return Promise.resolve(null);
    return NotificationService.broadcast(input, ids);
  };

  // ── Contracts: expired ──────────────────────────────────────────────
  const expiredContracts = await prisma.contract.findMany({
    where: {
      expiryDate: { lt: now },
      status: { in: ['ACTIVE', 'EXECUTED', 'RENEWED', 'EXPIRING_SOON'] },
    },
    select: { id: true, contractNumber: true, title: true, requesterId: true, assigneeId: true },
  });
  for (const c of expiredContracts) {
    await prisma.contract.update({ where: { id: c.id }, data: { status: 'EXPIRED' } });
    await notifyMany([...staff, c.requesterId, ...(c.assigneeId ? [c.assigneeId] : [])], {
      title: 'Contract expired',
      body: `${c.contractNumber} — ${c.title} has passed its expiry date.`,
      type: 'EXPIRY_ALERT',
      priority: 'HIGH',
      module: 'CMS',
      relatedId: c.id,
      actionUrl: `/contracts/${c.id}`,
    });
  }

  // ── Contracts: expiring soon (within renewalAlertDays) ──────────────
  const activeContracts = await prisma.contract.findMany({
    where: { expiryDate: { gte: now }, status: { in: ['ACTIVE', 'EXECUTED', 'RENEWED'] } },
    select: { id: true, contractNumber: true, title: true, expiryDate: true, renewalAlertDays: true, requesterId: true, assigneeId: true },
  });
  let contractsExpiring = 0;
  for (const c of activeContracts) {
    if (!c.expiryDate) continue;
    const alertFrom = new Date(c.expiryDate.getTime() - c.renewalAlertDays * 24 * 60 * 60 * 1000);
    if (now >= alertFrom) {
      await prisma.contract.update({ where: { id: c.id }, data: { status: 'EXPIRING_SOON' } });
      contractsExpiring++;
      await notifyMany([...staff, c.requesterId, ...(c.assigneeId ? [c.assigneeId] : [])], {
        title: 'Contract expiring soon',
        body: `${c.contractNumber} — ${c.title} expires on ${c.expiryDate.toLocaleDateString()}. Review for renewal.`,
        type: 'EXPIRY_ALERT',
        priority: 'MEDIUM',
        module: 'CMS',
        relatedId: c.id,
        actionUrl: `/contracts/${c.id}`,
      });
    }
  }

  // ── Contracts: SLA (drafting/approval turnaround) breached ──────────
  const slaContracts = await prisma.contract.findMany({
    where: {
      slaDeadline: { lt: now },
      slaBreached: false,
      status: { in: ['DRAFT', 'UNDER_REVIEW', 'PENDING_APPROVAL'] },
    },
    select: { id: true, contractNumber: true, title: true, assigneeId: true },
  });
  for (const c of slaContracts) {
    await prisma.contract.update({ where: { id: c.id }, data: { slaBreached: true } });
    await notifyMany([...staff, ...(c.assigneeId ? [c.assigneeId] : [])], {
      title: 'Contract SLA breached',
      body: `${c.contractNumber} — ${c.title} has exceeded its turnaround SLA.`,
      type: 'SLA_ALERT',
      priority: 'HIGH',
      module: 'CMS',
      relatedId: c.id,
      actionUrl: `/contracts/${c.id}`,
    });
  }

  // ── Legal requests: SLA breached (BR-LAHD-04) ───────────────────────
  const slaRequests = await prisma.legalRequest.findMany({
    where: {
      slaDeadline: { lt: now },
      slaBreached: false,
      slaMetAt: null,
      status: { notIn: ['APPROVED', 'DISPATCHED', 'CLOSED', 'ARCHIVED', 'REJECTED', 'DRAFT'] },
    },
    select: { id: true, requestNumber: true, subject: true, assigneeId: true },
  });
  for (const r of slaRequests) {
    await prisma.legalRequest.update({ where: { id: r.id }, data: { slaBreached: true } });
    await notifyMany([...staff, ...(r.assigneeId ? [r.assigneeId] : [])], {
      title: 'Advisory SLA breached',
      body: `${r.requestNumber} — ${r.subject} has exceeded its SLA deadline.`,
      type: 'SLA_ALERT',
      priority: 'HIGH',
      module: 'LAHD',
      relatedId: r.id,
      actionUrl: `/advisory/${r.id}`,
    });
  }

  return {
    contractsExpired: expiredContracts.length,
    contractsExpiring,
    contractsSlaBreached: slaContracts.length,
    requestsSlaBreached: slaRequests.length,
    ranAt: now.toISOString(),
  };
}
