import prisma from '@/lib/prisma';
import { EmailService } from '@/services/email.service';
import type { NotificationPreference } from '@prisma/client';

type PrefSelector = (p: NotificationPreference | null) => boolean;

interface EmailSpec {
  title: string;
  body: string;
  /** Relative path; combined with APP_URL for the email button. */
  actionUrl: string;
  /** Which NotificationPreference flag gates delivery for this event. */
  pref: PrefSelector;
}

/**
 * Fire-and-forget email fan-out that finally connects EmailService to the
 * workflow (BR-CMS-12). Respects each recipient's NotificationPreference and
 * is gated behind EMAIL_ENABLED so local/dev runs don't attempt SMTP. Errors
 * are swallowed + logged to EmailLog inside EmailService.
 */
export async function dispatchEmails(recipientIds: string[], spec: EmailSpec) {
  if (process.env.EMAIL_ENABLED !== 'true') return;

  const ids = [...new Set(recipientIds)].filter(Boolean);
  if (ids.length === 0) return;

  const base = process.env.APP_URL ?? '';
  const users = await prisma.user.findMany({
    where: { id: { in: ids }, isActive: true },
    include: { notificationPreference: true },
  });

  for (const u of users) {
    if (!spec.pref(u.notificationPreference)) continue;
    void EmailService.sendAnnouncement(u.email, {
      title: spec.title,
      body: spec.body,
      actionUrl: `${base}${spec.actionUrl}`,
      userId: u.id,
    }).catch(() => {});
  }
}

/** Preference selectors for the common workflow event families. */
export const EmailPref = {
  advisory: (p: NotificationPreference | null) => p?.emailAdvisory ?? true,
  contracts: (p: NotificationPreference | null) => p?.emailContracts ?? true,
  approvals: (p: NotificationPreference | null) => p?.emailApprovals ?? true,
  sla: (p: NotificationPreference | null) => p?.emailSLA ?? true,
};
