import { prisma } from '@/lib/prisma';
import { AnnouncementPriority, AnnouncementStatus } from '@prisma/client';

export const AnnouncementService = {
  async create(opts: {
    title: string;
    body: string;
    priority?: AnnouncementPriority;
    targetRoles?: string[];
    authorId: string;
    publishAt?: Date;
    expiresAt?: Date;
  }) {
    return prisma.announcement.create({
      data: {
        title: opts.title,
        body: opts.body,
        priority: opts.priority ?? 'MEDIUM',
        targetRoles: opts.targetRoles ?? ['ALL'],
        authorId: opts.authorId,
        publishAt: opts.publishAt,
        expiresAt: opts.expiresAt,
        status: opts.publishAt && opts.publishAt > new Date() ? 'DRAFT' : 'PUBLISHED'
      }
    });
  },

  async getActive(userRole?: string) {
    const now = new Date();
    
    // In a real system, you'd filter by targetRoles overlapping with userRole
    // For now, fetch PUBLISHED announcements that haven't expired
    return prisma.announcement.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      include: {
        author: { select: { firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  },
  
  async archive(id: string) {
    return prisma.announcement.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });
  }
};
