import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/services/message.service';
import { getCurrentUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'inbox'; // inbox, sent

    let messages;
    if (type === 'sent') {
      messages = await MessageService.getSent(user.id);
    } else {
      messages = await MessageService.getInbox(user.id);
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.recipientId || !body.body?.trim()) {
      return NextResponse.json({ error: 'Recipient and message are required' }, { status: 400 });
    }
    
    // Simplification for sending message
    if (body.threadId) {
      await MessageService.reply({
        threadId: body.threadId,
        body: body.body,
        recipientId: body.recipientId,
        senderId: user.id,
      });
    } else {
      if (!body.subject?.trim()) {
        return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
      }
      await MessageService.createThread({
        subject: body.subject,
        body: body.body,
        recipientId: body.recipientId,
        senderId: user.id,
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
