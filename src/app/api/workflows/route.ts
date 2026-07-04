import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/services/workflow.service';
import { prisma } from '@/lib/prisma';

async function getSessionUserId() {
  const user = await prisma.user.findFirst({ where: { role: { name: 'Admin' } } });
  return user?.id || '';
}

export async function GET(req: NextRequest) {
  try {
    const definitions = await WorkflowService.getAllDefinitions();
    return NextResponse.json({ workflows: definitions });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const def = await WorkflowService.createDefinition({
      name: body.name,
      description: body.description,
      module: body.module,
      createdById: userId,
    });
    
    return NextResponse.json({ workflow: def });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}
