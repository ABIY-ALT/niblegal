import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/notification.service';
import { AnnouncementService } from '@/services/announcement.service';
import { MessageService } from '@/services/message.service';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = user.id;

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'ALL';
    const type = searchParams.get('type') || 'ALL';
    const priority = searchParams.get('priority') || 'ALL';

    const [notifications, unreadCount, unreadMessages, announcements] = await Promise.all([
      NotificationService.getForUser(userId, { page, limit, status, type, priority }),
      NotificationService.getUnreadCount(userId),
      MessageService.getUnreadCount(userId),
      AnnouncementService.getActive(),
    ]);

    return NextResponse.json({
      notifications: notifications.items,
      pagination: {
        page: notifications.page,
        limit: notifications.limit,
        total: notifications.total,
        totalPages: notifications.totalPages,
      },
      stats: {
        unreadNotifications: unreadCount,
        unreadMessages: unreadMessages,
      },
      announcements,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(_req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Mark all as read
    await NotificationService.markAllRead(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark all as read:', error);
    return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 });
  }
}
