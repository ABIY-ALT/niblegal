import { prisma } from '@/lib/prisma';

export type CreateNotificationInput = {
  title: string;
  body: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'APPROVAL' | 'REMINDER' | 'ANNOUNCEMENT' | 'WORKFLOW' | 'SLA_ALERT' | 'EXPIRY_ALERT';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  module?: string;
  relatedId?: string;
  actionUrl?: string;
  recipientId: string;
  senderId?: string;
  expiresAt?: Date;
};

export const NotificationService = {
  /** Create a single notification for one recipient */
  async create(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        title: input.title,
        body: input.body,
        type: input.type ?? 'INFO',
        priority: input.priority ?? 'MEDIUM',
        module: input.module,
        relatedId: input.relatedId,
        actionUrl: input.actionUrl,
        recipientId: input.recipientId,
        senderId: input.senderId,
        expiresAt: input.expiresAt,
      },
    });
  },

  /** Broadcast a notification to multiple users */
  async broadcast(input: Omit<CreateNotificationInput, 'recipientId'>, recipientIds: string[]) {
    return prisma.notification.createMany({
      data: recipientIds.map((recipientId) => ({
        title: input.title,
        body: input.body,
        type: input.type ?? 'INFO',
        priority: input.priority ?? 'MEDIUM',
        module: input.module,
        relatedId: input.relatedId,
        actionUrl: input.actionUrl,
        recipientId,
        senderId: input.senderId,
        expiresAt: input.expiresAt,
      })),
    });
  },

  /** Notify all Legal Officers + Managers about a workflow event */
  async notifyWorkflow(params: {
    title: string;
    body: string;
    type?: CreateNotificationInput['type'];
    priority?: CreateNotificationInput['priority'];
    module: string;
    relatedId: string;
    actionUrl: string;
    senderId: string;
    recipientIds: string[];
  }) {
    return this.broadcast(
      {
        title: params.title,
        body: params.body,
        type: params.type ?? 'WORKFLOW',
        priority: params.priority ?? 'MEDIUM',
        module: params.module,
        relatedId: params.relatedId,
        actionUrl: params.actionUrl,
        senderId: params.senderId,
      },
      params.recipientIds
    );
  },

  /** Get unread count for a user */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { recipientId: userId, status: 'UNREAD' },
    });
  },

  /** Get paginated notifications for a user */
  async getForUser(
    userId: string,
    opts: { page?: number; limit?: number; status?: string; type?: string } = {}
  ) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = { recipientId: userId };
    if (opts.status && opts.status !== 'ALL') where.status = opts.status;
    if (opts.type && opts.type !== 'ALL') where.type = opts.type;

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          sender: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /** Mark a single notification as read */
  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { status: 'READ', readAt: new Date() },
    });
  },

  /** Mark all unread notifications for a user as read */
  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { recipientId: userId, status: 'UNREAD' },
      data: { status: 'READ', readAt: new Date() },
    });
  },

  /** Archive a notification */
  async archive(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { status: 'ARCHIVED' },
    });
  },

  /** Delete (soft) a notification */
  async delete(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, recipientId: userId },
      data: { status: 'DELETED' },
    });
  },

  /** Toggle pin */
  async togglePin(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({ where: { id, recipientId: userId } });
    if (!notif) return null;
    return prisma.notification.update({
      where: { id },
      data: { isPinned: !notif.isPinned },
    });
  },

  /** Toggle star */
  async toggleStar(id: string, userId: string) {
    const notif = await prisma.notification.findFirst({ where: { id, recipientId: userId } });
    if (!notif) return null;
    return prisma.notification.update({
      where: { id },
      data: { isStarred: !notif.isStarred },
    });
  },
};
