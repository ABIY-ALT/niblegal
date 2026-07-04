import prisma from '@/lib/prisma';

interface NotifyParams {
  documentId: string;
  actorId?: string | null;
  title: string;
  message: string;
  channel?: 'EMAIL' | 'INTERNAL';
}

/**
 * Records a notification intent as a history entry. No SMTP/vendor is wired
 * up yet — this is the single seam to replace with a real send later.
 */
export async function notifyKnowledge({ documentId, actorId, title, message, channel = 'INTERNAL' }: NotifyParams) {
  await prisma.knowledgeHistory.create({
    data: {
      documentId,
      actorId: actorId ?? null,
      action: channel === 'EMAIL' ? 'NOTIFICATION_EMAIL_SENT' : 'NOTIFICATION_SENT',
      description: `${title}: ${message}`,
    },
  });
}
