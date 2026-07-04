import prisma from '@/lib/prisma';

interface NotifyParams {
  legalRequestId: string;
  actorId?: string | null;
  title: string;
  message: string;
  channel?: 'EMAIL' | 'INTERNAL';
}

/**
 * Records a notification intent as a history entry. No SMTP/vendor is wired
 * up yet — this is the single seam to replace with a real send later.
 */
export async function notify({ legalRequestId, actorId, title, message, channel = 'INTERNAL' }: NotifyParams) {
  await prisma.legalHistory.create({
    data: {
      legalRequestId,
      actorId: actorId ?? null,
      action: channel === 'EMAIL' ? 'NOTIFICATION_EMAIL_SENT' : 'NOTIFICATION_SENT',
      description: `${title}: ${message}`,
    },
  });
}
