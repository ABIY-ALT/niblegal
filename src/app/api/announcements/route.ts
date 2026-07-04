import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementService } from '@/services/announcement.service';
import { prisma } from '@/lib/prisma';

async function getSessionUserId() {
  const user = await prisma.user.findFirst({ where: { role: { name: 'Admin' } } });
  return user?.id || '';
}

export async function GET(req: NextRequest) {
  try {
    const announcements = await AnnouncementService.getActive();
    return NextResponse.json({ announcements });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const announcement = await AnnouncementService.create({
      title: body.title,
      body: body.body,
      priority: body.priority,
      targetRoles: body.targetRoles,
      authorId: userId,
      publishAt: body.publishAt ? new Date(body.publishAt) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
    
    return NextResponse.json({ announcement });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 });
  }
}
