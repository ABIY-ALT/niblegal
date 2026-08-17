import { prisma } from '@/lib/prisma';

export const MessageService = {
  /** Create a new message thread */
  async createThread(opts: {
    subject: string;
    body: string;
    senderId: string;
    recipientId: string;
  }) {
    return prisma.messageThread.create({
      data: {
        subject: opts.subject,
        messages: {
          create: {
            body: opts.body,
            senderId: opts.senderId,
            recipientId: opts.recipientId,
          }
        }
      },
      include: {
        messages: true
      }
    });
  },

  /** Reply to an existing thread */
  async reply(opts: {
    threadId: string;
    body: string;
    senderId: string;
    recipientId: string;
    parentId?: string;
  }) {
    return prisma.message.create({
      data: {
        threadId: opts.threadId,
        body: opts.body,
        senderId: opts.senderId,
        recipientId: opts.recipientId,
        parentId: opts.parentId,
      }
    });
  },

  /** Get inbox for a user (threads where they are the recipient of the latest message, or part of it) */
  async getInbox(userId: string) {
    // Basic implementation: get all messages where user is recipient
    return prisma.message.findMany({
      where: { recipientId: userId, status: { notIn: ['DELETED', 'ARCHIVED'] } },
      include: {
        thread: true,
        sender: { select: { id: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } } },
        recipient: { select: { id: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /** Get sent messages */
  async getSent(userId: string) {
    return prisma.message.findMany({
      where: { senderId: userId, status: { notIn: ['DELETED', 'ARCHIVED'] } },
      include: {
        thread: true,
        sender: { select: { id: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } } },
        recipient: { select: { id: true, firstName: true, lastName: true, email: true, role: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  /** Mark message as read */
  async markRead(messageId: string, userId: string) {
    return prisma.message.updateMany({
      where: { id: messageId, recipientId: userId },
      data: { isRead: true, readAt: new Date(), status: 'READ' }
    });
  },
  
  /** Get unread message count */
  async getUnreadCount(userId: string) {
    return prisma.message.count({
      where: { recipientId: userId, isRead: false, status: { notIn: ['DELETED', 'ARCHIVED'] } }
    });
  }
};
