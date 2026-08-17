import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { verifyJwt, signJwt } from '@/lib/jwt';
import { USERS } from '@/data/store';
import { addAuditEntry, clearFailedAttempts } from '@/lib/loginSecurity';

/**
 * POST /api/auth/mfa
 * Body: { code: string }
 *
 * Validates the 6-digit TOTP code against the user's mfaSecret.
 * Requires the nib_preauth cookie set during /api/auth/login.
 *
 * NOTE: Real TOTP requires a TOTP library (e.g. otplib). This implementation
 * stubs the verification — replace verifyTotp() with your TOTP library call.
 */

function verifyTotp(code: string, _secret: string): boolean {
  // TODO: replace with real TOTP validation, e.g.:
  //   import { authenticator } from 'otplib';
  //   return authenticator.verify({ token: code, secret: _secret });
  //
  // For development: accept '000000' as a bypass code, otherwise reject.
  return code === '000000';
}

function getClientIp(reqHeaders: Headers): string {
  return (
    reqHeaders.get('x-forwarded-for')?.split(',')[0].trim() ??
    reqHeaders.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(request: Request) {
  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders as unknown as Headers);
  const userAgent = reqHeaders.get('user-agent') ?? 'unknown';

  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'Please enter a valid 6-digit code.' }, { status: 400 });
    }

    // ── Validate pre-auth token ───────────────────────────────────────────────
    const cookieStore = await cookies();
    const preAuthCookie = cookieStore.get('nib_preauth');
    if (!preAuthCookie?.value) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 });
    }

    const payload = await verifyJwt(preAuthCookie.value);
    if (!payload) {
      return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 });
    }

    // ── Find user and verify TOTP ─────────────────────────────────────────────
    const user = USERS.find((u) => u.id === payload.sub);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const mfaSecret = (user as unknown as Record<string, unknown>).mfaSecret as string | undefined;
    if (!mfaSecret) {
      return NextResponse.json({ error: 'MFA not configured for this account.' }, { status: 400 });
    }

    const valid = verifyTotp(code, mfaSecret);
    if (!valid) {
      addAuditEntry({ email: user.email, event: 'MFA_FAILURE', ipAddress: ip, userAgent, userId: user.id, reason: 'Invalid TOTP code' });
      return NextResponse.json({ error: 'Invalid authentication code. Please try again.' }, { status: 401 });
    }

    // ── Issue full JWT + clear preauth cookie ─────────────────────────────────
    const token = await signJwt({ sub: user.id, email: user.email, role: user.role }, 60 * 60 * 8);
    cookieStore.delete('nib_preauth');
    cookieStore.set('nib_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });
    cookieStore.set('nib_session', JSON.stringify({ userId: user.id, role: user.role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    clearFailedAttempts(user.email);
    addAuditEntry({ email: user.email, event: 'MFA_SUCCESS', ipAddress: ip, userAgent, userId: user.id });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch (error) {
    console.error('[MFA ERROR]:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
