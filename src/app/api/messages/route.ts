import { NextRequest, NextResponse } from 'next/server';
import { MessageService } from '@/services/message.service';
import { prisma } from '@/lib/prisma';

async function getSessionUserId() {
  const user = await prisma.user.findFirst({ where: { role: { name: 'Admin' } } });
  return user?.id || '';
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'inbox'; // inbox, sent

    let messages;
    if (type === 'sent') {
      messages = await MessageService.getSent(userId);
    } else {
      messages = await MessageService.getInbox(userId);
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    
    // Simplification for sending message
    if (body.threadId) {
      await MessageService.reply({
        threadId: body.threadId,
        body: body.body,
        recipientId: body.recipientId,
        senderId: userId,
      });
    } else {
      await MessageService.createThread({
        subject: body.subject,
        body: body.body,
        recipientId: body.recipientId,
        senderId: userId,
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
