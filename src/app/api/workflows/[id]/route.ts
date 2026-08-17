import { NextRequest, NextResponse } from 'next/server';
import { WorkflowService } from '@/services/workflow.service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const workflow = await WorkflowService.getDefinition(id);
    if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ workflow });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === 'publish') {
      await WorkflowService.publishVersion(id, body.versionId);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'new_version') {
      const newVersion = await WorkflowService.createNewVersion(id, body.baseVersionId);
      return NextResponse.json({ version: newVersion });
    }

    if (body.action === 'update_flow') {
      await WorkflowService.updateVersionFlow(body.versionId, body.flowData);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
