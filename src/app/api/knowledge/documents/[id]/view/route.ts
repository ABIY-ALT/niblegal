import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { logKnowledgeActivity } from '@/lib/knowledgeHistory';

// Fire-and-forget view logging, powers the "Recently Viewed" favorites section.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await logKnowledgeActivity({
    documentId: id,
    actorId: user.id,
    action: 'VIEWED',
    description: `Viewed by ${user.name}`,
  });

  return NextResponse.json({ success: true });
}
