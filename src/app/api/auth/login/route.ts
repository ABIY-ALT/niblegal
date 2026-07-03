import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { USERS } from '@/data/store';
import { signJwt } from '@/lib/jwt';
import {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
  addAuditEntry,
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
} from '@/lib/loginSecurity';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getClientIp(reqHeaders: Headers): string {
  return (
    reqHeaders.get('x-forwarded-for')?.split(',')[0].trim() ??
    reqHeaders.get('x-real-ip') ??
    'unknown'
  );
}

function formatLockDuration(ms: number): string {
  const mins = Math.ceil(ms / 60000);
  return mins === 1 ? '1 minute' : `${mins} minutes`;
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────

export async function POST(request: Request) {
  const reqHeaders = await headers();
  const ip = getClientIp(reqHeaders as unknown as Headers);
  const userAgent = reqHeaders.get('user-agent') ?? 'unknown';

  let email = '';

  try {
    const body = await request.json();
    email = (body.email ?? '').trim().toLowerCase();
    const { password, rememberMe } = body;

    // ── Basic validation ─────────────────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 },
      );
    }

    // ── Account lock check ───────────────────────────────────────────────────
    const { locked, remainingMs } = isAccountLocked(email);
    if (locked) {
      addAuditEntry({ email, event: 'LOCKED', ipAddress: ip, userAgent, reason: 'Account locked — too many failed attempts' });
      return NextResponse.json(
        {
          error: `Account temporarily locked. Try again in ${formatLockDuration(remainingMs)}.`,
          locked: true,
          remainingMs,
        },
        { status: 423 },
      );
    }

    // ── Find user ────────────────────────────────────────────────────────────
    const user = USERS.find((u) => u.email.toLowerCase() === email);

    if (!user) {
      // Don't reveal whether email exists — record failure anyway
      const { attemptsLeft, locked: nowLocked } = recordFailedAttempt(email);
      addAuditEntry({ email, event: 'FAILURE', ipAddress: ip, userAgent, reason: 'Email not found' });
      const msg = nowLocked
        ? `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${formatLockDuration(LOCKOUT_DURATION_MS)}.`
        : `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before lockout.`;
      return NextResponse.json({ error: msg, attemptsLeft, locked: nowLocked }, { status: 401 });
    }

    // ── Password verification ─────────────────────────────────────────────────
    // In production this would use: await bcrypt.compare(password, user.passwordHash)
    // For local dev with mock data, we accept any non-empty password.
    const passwordValid = password.length > 0; // TODO: replace with bcrypt.compare

    if (!passwordValid) {
      const { attemptsLeft, locked: nowLocked } = recordFailedAttempt(email);
      addAuditEntry({ email, event: 'FAILURE', ipAddress: ip, userAgent, userId: user.id, reason: 'Incorrect password' });
      const msg = nowLocked
        ? `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${formatLockDuration(LOCKOUT_DURATION_MS)}.`
        : `Invalid credentials. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} remaining before lockout.`;
      return NextResponse.json({ error: msg, attemptsLeft, locked: nowLocked }, { status: 401 });
    }

    // ── MFA check ─────────────────────────────────────────────────────────────
    // Check if user has MFA enabled (from the DB user model's mfaEnabled field)
    // For mock store we check a mfaEnabled flag; mock users don't have it → skip MFA
    const mfaEnabled = (user as Record<string, unknown>).mfaEnabled === true;
    if (mfaEnabled) {
      // Store a short-lived pre-auth token so the MFA step can identify the user
      const preAuthToken = await signJwt(
        { sub: user.id, email: user.email, role: user.role },
        300, // 5-minute window to enter MFA code
      );
      const cookieStore = await cookies();
      cookieStore.set('nib_preauth', preAuthToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 300,
        path: '/',
      });
      addAuditEntry({ email, event: 'MFA_SENT', ipAddress: ip, userAgent, userId: user.id });
      return NextResponse.json({ requiresMfa: true });
    }

    // ── Issue JWT + session cookie ────────────────────────────────────────────
    const expiresIn = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 8; // 30 days or 8 hours
    const token = await signJwt(
      { sub: user.id, email: user.email, role: user.role },
      expiresIn,
    );

    const cookieStore = await cookies();
    cookieStore.set('nib_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });
    // Keep legacy session cookie for AppShell compatibility
    cookieStore.set('nib_session', JSON.stringify({ userId: user.id, role: user.role }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });

    // ── Clear failures + audit ───────────────────────────────────────────────
    clearFailedAttempts(email);
    addAuditEntry({ email, event: 'SUCCESS', ipAddress: ip, userAgent, userId: user.id });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]:', error);
    if (email) addAuditEntry({ email, event: 'FAILURE', ipAddress: ip, userAgent, reason: 'Internal error' });
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
