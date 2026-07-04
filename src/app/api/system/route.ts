import { NextRequest, NextResponse } from 'next/server';
import { SystemService } from '@/services/system.service';
import { prisma } from '@/lib/prisma';

// Helper to simulate admin check
async function ensureAdmin() {
  const user = await prisma.user.findFirst({ where: { role: { name: 'Admin' } } });
  if (!user) throw new Error('Unauthorized');
  return user.id;
}

export async function GET(req: NextRequest) {
  try {
    await ensureAdmin();

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';

    const [
      system,
      security,
      smtp,
      numbering,
      flags,
      apiKeys,
      logs
    ] = await Promise.all([
      SystemService.getSystemSettings(),
      SystemService.getSecuritySettings(),
      SystemService.getSmtpSettings(),
      SystemService.getNumberingSettings(),
      SystemService.getFeatureFlags(),
      SystemService.getApiKeys(),
      SystemService.getApplicationLogs(10)
    ]);

    return NextResponse.json({
      system,
      security,
      smtp,
      numbering,
      flags,
      apiKeys,
      logs,
      health: {
        status: 'Operational',
        database: 'Connected',
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
        uptime: process.uptime()
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await ensureAdmin();
    const body = await req.json();
    const type = body.type; // system, security, smtp, numbering, flag

    switch (type) {
      case 'system':
        await SystemService.updateSystemSettings(body.data);
        break;
      case 'security':
        await SystemService.updateSecuritySettings(body.data);
        break;
      case 'smtp':
        await SystemService.updateSmtpSettings(body.data);
        break;
      case 'numbering':
        await SystemService.updateNumberingSettings(body.data);
        break;
      case 'flag':
        await SystemService.toggleFeatureFlag(body.data.id, body.data.isEnabled);
        break;
      default:
        return NextResponse.json({ error: 'Invalid settings type' }, { status: 400 });
    }
    
    // Log audit action
    await SystemService.logEvent('INFO', 'SYSTEM', `Updated ${type} settings`);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureAdmin();
    const body = await req.json();
    
    if (body.action === 'createApiKey') {
      const apiKey = await SystemService.createApiKey(body.name, body.scopes);
      await SystemService.logEvent('INFO', 'AUTH', `Created API key: ${body.name}`);
      return NextResponse.json({ apiKey });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
