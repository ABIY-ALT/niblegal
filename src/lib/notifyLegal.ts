import prisma from '@/lib/prisma';
import { NotificationService, type CreateNotificationInput } from '@/services/notification.service';
import { dispatchEmails, EmailPref } from '@/lib/emailDispatch';

interface NotifyLegalParams {
  legalRequestId: string;
  requestNumber: string;
  title: string;
  body: string;
  type?: CreateNotificationInput['type'];
  priority?: CreateNotificationInput['priority'];
  actorId: string;
  /** Display-name roles from the Role table, e.g. ['Manager', 'Legal Officer']. */
  recipientRoles?: string[];
  /** Explicit user ids to notify (requester, assignee, …). */
  recipientIds?: string[];
  /** Also send branded email (respecting preferences + EMAIL_ENABLED). */
  email?: boolean;
}

/**
 * In-app + email fan-out for LAHD workflow events (BR-LAHD-03/04). Writes real
 * Notification rows so the bell reflects the maker–checker flow — the LAHD twin
 * of notifyContract.
 */
export async function notifyLegalWorkflow(params: NotifyLegalParams) {
  const ids = new Set(params.recipientIds ?? []);

  if (params.recipientRoles?.length) {
    const users = await prisma.user.findMany({
      where: { isActive: true, role: { name: { in: params.recipientRoles } } },
      select: { id: true },
    });
    for (const u of users) ids.add(u.id);
  }

  ids.delete(params.actorId);
  const recipientIds = [...ids];
  if (recipientIds.length === 0) return;

  const actionUrl = `/advisory/${params.legalRequestId}`;
  await NotificationService.broadcast(
    {
      title: params.title,
      body: params.body,
      type: params.type ?? 'WORKFLOW',
      priority: params.priority ?? 'MEDIUM',
      module: 'LAHD',
      relatedId: params.legalRequestId,
      actionUrl,
      senderId: params.actorId,
    },
    recipientIds,
  );

  if (params.email) {
    await dispatchEmails(recipientIds, {
      title: params.title,
      body: `${params.requestNumber} — ${params.body}`,
      actionUrl,
      pref: params.type === 'APPROVAL' ? EmailPref.approvals : EmailPref.advisory,
    });
  }
}
