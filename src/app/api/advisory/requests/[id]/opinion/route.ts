import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { opinionSaveSchema } from '@/lib/validations/advisory';
import { logLegalActivity } from '@/lib/advisoryHistory';
import { transitionStage } from '@/lib/workflow';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validated = opinionSaveSchema.parse(body);

    const legalRequest = await prisma.legalRequest.findUnique({ where: { id }, include: { opinion: true } });
    if (!legalRequest) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (legalRequest.assigneeId !== user.id) {
      return NextResponse.json({ error: 'Only the assigned officer can draft this opinion' }, { status: 403 });
    }

    const existingOpinion = legalRequest.opinion;
    const nextVersion = (existingOpinion?.currentVersion ?? 0) + 1;

    const opinion = existingOpinion
      ? await prisma.legalOpinion.update({
          where: { id: existingOpinion.id },
          data: { content: validated.content, currentVersion: nextVersion },
        })
      : await prisma.legalOpinion.create({
          data: { legalRequestId: id, content: validated.content, currentVersion: 1 },
        });

    await prisma.legalOpinionVersion.create({
      data: {
        opinionId: opinion.id,
        versionNumber: nextVersion,
        content: validated.content,
        changeNote: validated.changeNote,
        createdById: user.id,
      },
    });

    if (legalRequest.status === 'ASSIGNED' || legalRequest.status === 'RETURNED') {
      await prisma.legalRequest.update({ where: { id }, data: { status: 'DRAFTING' } });
      await transitionStage(id, 'DRAFTING', user.id);
    }

    await logLegalActivity({
      legalRequestId: id,
      actorId: user.id,
      action: 'OPINION_DRAFT_SAVED',
      description: `Draft opinion saved (v${nextVersion}) by ${user.name}`,
    });

    return NextResponse.json({ data: opinion });
  } catch (error) {
    console.error('Failed to save opinion draft:', error);
    return NextResponse.json({ error: 'Failed to save opinion draft' }, { status: 400 });
  }
}
