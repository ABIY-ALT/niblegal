import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { runSlaScan } from '@/lib/jobs/slaScan';

/**
 * Trigger the SLA / expiry / renewal scan (BR-CMS-07, BR-LAHD-04).
 *
 * Meant to be hit on a schedule by an external cron (Windows Task Scheduler,
 * a cron container, or a hosted cron) with the `x-cron-secret` header. A
 * signed-in Manager may also run it on demand from the UI.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get('x-cron-secret');

  let authorized = false;
  if (secret && provided && provided === secret) {
    authorized = true;
  } else {
    const user = await getCurrentUser();
    if (user?.role === 'manager') authorized = true;
  }

  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await runSlaScan();
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('SLA scan failed:', error);
    return NextResponse.json({ error: 'SLA scan failed' }, { status: 500 });
  }
}
