import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { addAuditEntry, getAuditLog, getAuditLogForUser } from '@/lib/loginSecurity';
import { verifyJwt } from '@/lib/jwt';
import { USERS } from '@/data/store';

/**
 * GET /api/auth/audit-log
 * Query params: ?email=... (optional filter) &limit=50
 * Requires valid nib_token cookie (admin/manager only in production).
 *
 * POST /api/auth/logout
 * Clears all auth cookies and writes a LOGOUT audit entry.
 */

// ── GET — fetch audit log ─────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('nib_token');
    if (!tokenCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const payload = await verifyJwt(tokenCookie.value);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const email = url.searchParams.get('email') ?? undefined;
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '100', 10), 500);

    const log = email ? getAuditLogForUser(email, limit) : getAuditLog(limit);
    return NextResponse.json({ log });
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// ── DELETE — logout ───────────────────────────────────────────────────────────
export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('nib_token') ?? cookieStore.get('nib_session');

    let email = 'unknown';
    if (tokenCookie?.value) {
      try {
        const payload = await verifyJwt(tokenCookie.value);
        if (payload) email = payload.email;
        else {
          const session = JSON.parse(tokenCookie.value);
          const user = USERS.find(u => u.id === session.userId);
          if (user) email = user.email;
        }
      } catch { /* ignore */ }
    }

    const reqHeaders = request.headers;
    const ip = reqHeaders.get('x-forwarded-for')?.split(',')[0].trim() ?? reqHeaders.get('x-real-ip') ?? 'unknown';
    const userAgent = reqHeaders.get('user-agent') ?? 'unknown';

    addAuditEntry({ email, event: 'LOGOUT', ipAddress: ip, userAgent });

    cookieStore.delete('nib_token');
    cookieStore.delete('nib_session');
    cookieStore.delete('nib_preauth');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
