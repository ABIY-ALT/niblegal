import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/services/notification.service';
import { getCurrentUser } from '@/lib/session';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = body.action; // 'read', 'archive', 'delete', 'pin'

    switch (action) {
      case 'read':
        await NotificationService.markRead(id, user.id);
        break;
      case 'archive':
        await NotificationService.archive(id, user.id);
        break;
      case 'delete':
        await NotificationService.delete(id, user.id);
        break;
      case 'pin':
        await NotificationService.togglePin(id, user.id);
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to execute action on notification ${id}:`, error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await NotificationService.delete(id, user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
