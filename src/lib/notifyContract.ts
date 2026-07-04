import prisma from '@/lib/prisma';
import { NotificationService, type CreateNotificationInput } from '@/services/notification.service';
import { dispatchEmails, EmailPref } from '@/lib/emailDispatch';

interface NotifyContractParams {
  contractId: string;
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
 * Fan-out for CMS workflow events. Resolves role names to users, dedupes,
 * drops the actor, and writes real Notification rows (BR-CMS-07/12). This is
 * the seam the CMS routes call so the bell reflects the maker–checker flow.
 */
export async function notifyContractWorkflow(params: NotifyContractParams) {
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

  const actionUrl = `/contracts/${params.contractId}`;
  await NotificationService.broadcast(
    {
      title: params.title,
      body: params.body,
      type: params.type ?? 'WORKFLOW',
      priority: params.priority ?? 'MEDIUM',
      module: 'CMS',
      relatedId: params.contractId,
      actionUrl,
      senderId: params.actorId,
    },
    recipientIds,
  );

  if (params.email) {
    await dispatchEmails(recipientIds, {
      title: params.title,
      body: params.body,
      actionUrl,
      pref: params.type === 'APPROVAL' ? EmailPref.approvals : EmailPref.contracts,
    });
  }
}
