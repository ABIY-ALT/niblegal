'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Eye, EyeOff, Lock, User, Shield,
  Building2, AlertCircle, CheckCircle, Clock,
  Fingerprint, ArrowLeft, RefreshCw, ChevronRight,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 'credentials' | 'mfa';
type FieldErrors = { email?: string; password?: string; mfa?: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
function validateEmail(v: string) {
  if (!v.trim()) return 'Username is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return 'Use your work email as username (e.g. name@nibbank.et).';
  return '';
}
function validatePassword(v: string) {
  if (!v) return 'Password is required.';
  if (v.length < 4) return 'Password must be at least 4 characters.';
  return '';
}

// ── Countdown timer hook ──────────────────────────────────────────────────────
function useLockCountdown(remainingMs: number) {
  const [secs, setSecs] = useState(Math.ceil(remainingMs / 1000));
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [secs]);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  return { secs, display: `${mins}:${String(s).padStart(2, '0')}` };
}

// ── MFA digit input ───────────────────────────────────────────────────────────
function MfaCodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };
  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const arr = digits.slice();
    arr[i] = d;
    const next = arr.join('');
    onChange(next);
    if (d && i < 5) inputs.current[i + 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          style={{
            width: 48, height: 56, textAlign: 'center', fontSize: 22,
            fontWeight: 700, fontFamily: "'Outfit', monospace",
            background: 'var(--bg-input)', border: `2px solid ${digits[i] ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 10, color: 'var(--text-primary)',
            outline: 'none', transition: 'border-color 0.2s',
          }}
        />
      ))}
    </div>
  );
}



// ── Lock countdown banner ─────────────────────────────────────────────────────
function LockBanner({ remainingMs }: { remainingMs: number }) {
  const { secs, display } = useLockCountdown(remainingMs);
  return (
    <div className="login-lock-banner">
      <Clock size={16} style={{ flexShrink: 0 }} />
      <span>
        Account temporarily locked. Try again in{' '}
        <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{display}</strong>
        {secs === 0 && ' — you may now retry.'}
      </span>
    </div>
  );
}

// ── Hanging Badge ─────────────────────────────────────────────────────────────
const HangingBadge = () => {
  return (
    /* Positioning container: absolute to top-left of the parent */
    <div className="absolute top-0 left-12 z-20 pointer-events-none select-none group hidden sm:block">
      <div className="relative flex flex-col items-center">
        {/* The "Pin" or Nail holding the string */}
        <div className="w-1.5 h-1.5 rounded-full bg-accent/90 border border-accent/20 shadow-sm z-30" />

        {/* The Hanging String/Wire */}
        <div className="w-px h-16 bg-gradient-to-b from-accent/80 via-accent/40 to-transparent" />
        
        {/* The Shield Body */}
        <div
          className="relative -mt-0.5 flex flex-col items-center justify-center w-20 h-24 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)] transition-all duration-500 hover:scale-105"
          style={{
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)',
            background: 'linear-gradient(145deg, #DAA520 0%, #8B4513 100%)' // Branded Honey Gradient
          }}
        >
          {/* Inner Border Detail */}
          <div
            className="absolute inset-0.5 border border-white/20"
            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 50% 100%, 0% 85%)' }}
          />
          
          {/* Content */}
          <div className="flex flex-col items-center gap-1 z-10 px-1 text-center">
            <span className="text-[7px] font-bold text-white/80 leading-none uppercase tracking-widest">
              System by
            </span>
            <h3 className="text-base font-black text-white tracking-widest drop-shadow-lg">
              EPMO
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const emailRef = useRef<HTMLInputElement>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  // UI state
  const [step, setStep] = useState<Step>('credentials');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockRemainingMs, setLockRemainingMs] = useState<number>(0);
  const [isLocked, setIsLocked] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  // Auto-focus email on mount
  useEffect(() => { emailRef.current?.focus(); }, []);

  // ── Live validation ────────────────────────────────────────────────────────
  useEffect(() => {
    setFieldErrors(prev => ({
      ...prev,
      email: touched.email ? validateEmail(email) : '',
    }));
  }, [email, touched.email]);

  useEffect(() => {
    setFieldErrors(prev => ({
      ...prev,
      password: touched.password ? validatePassword(password) : '',
    }));
  }, [password, touched.password]);

  // ── Credentials submit ─────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');

    // Run full validation
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setTouched({ email: true, password: true });
    setFieldErrors({ email: emailErr, password: passErr });
    if (emailErr || passErr) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 423) {
          setIsLocked(true);
          setLockRemainingMs(data.remainingMs ?? 900000);
        } else {
          setAttemptsLeft(data.attemptsLeft ?? null);
        }
        setServerError(data.error ?? 'Invalid credentials.');
        return;
      }

      if (data.requiresMfa) {
        setStep('mfa');
        return;
      }

      setServerSuccess('Sign-in successful! Redirecting…');
      /* AppShell calls useCurrentUser() on this page too, so a 401 from
         /api/auth/me was already cached as `null` under ['current-user'] with a
         5-minute staleTime. Navigating client-side reuses that cached null, so
         the shell sat on its spinner instead of loading the dashboard. Drop the
         cache (also stops one user's data leaking into the next session). */
      queryClient.clear();
      setTimeout(() => router.replace('/dashboard'), 600);
    } catch {
      setServerError('Unable to reach the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ── MFA submit ─────────────────────────────────────────────────────────────
  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (mfaCode.length !== 6) {
      setFieldErrors(p => ({ ...p, mfa: 'Enter all 6 digits.' }));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: mfaCode }),
      });
      const data = await res.json();
      if (!res.ok) { setServerError(data.error ?? 'Invalid MFA code.'); return; }
      setServerSuccess('Verification successful! Redirecting…');
      queryClient.clear();
      setTimeout(() => router.replace('/dashboard'), 600);
    } catch {
      setServerError('MFA verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmitMfa = mfaCode.length === 6 && !loading;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="login-page login-page-hero login-hero-right relative overflow-hidden">
      {/* Hero background image */}
      <div className="login-hero-bg" aria-hidden="true" />

      {/* Dark overlay for readability */}
      <div className="login-hero-overlay" aria-hidden="true" />

      {/* System by EPMO Hanging Badge */}
      <HangingBadge />

      {/* Login card, anchored right over the hero artwork */}
      <div className="login-hero-wrapper login-hero-wrapper-right">
        {/* Card */}
        <div className="login-card login-card-glass login-card-secure">

          {/* Brand lockup */}
          <div className="login-brand-lockup">
            <Image
              src="/nib-logo.png"
              alt="Nib International Bank"
              width={54}
              height={54}
              className="login-brand-mark"
              priority
            />
            <div>
              <div className="login-brand-word">NIB</div>
              <div className="login-brand-sub">Legal Department System</div>
            </div>
          </div>

          {/* ── STEP: Credentials ──────────────────────────────── */}
          {step === 'credentials' && (
            <>
              <div className="login-card-header">
                <h2 className="login-access-title">Secure System Access</h2>
                <p className="login-access-sub">Welcome to the Legal Department System</p>
              </div>

              {isLocked && lockRemainingMs > 0 && (
                <LockBanner remainingMs={lockRemainingMs} />
              )}

              {serverError && !isLocked && (
                <div className="login-alert login-alert-error" role="alert">
                  <AlertCircle size={15} />
                  <span>{serverError}</span>
                  {attemptsLeft !== null && attemptsLeft > 0 && (
                    <span className="login-attempts-badge">{attemptsLeft} left</span>
                  )}
                </div>
              )}

              {serverSuccess && (
                <div className="login-alert login-alert-success" role="status">
                  <CheckCircle size={15} />
                  <span>{serverSuccess}</span>
                </div>
              )}

              <form onSubmit={handleLogin} noValidate>
                {/* Username */}
                <div className="login-field">
                  <label htmlFor="login-email" className="sr-only">
                    Username (work email)
                  </label>
                  <div className="login-input-wrap">
                    <User size={16} className="login-input-icon" />
                    <input
                      id="login-email"
                      ref={emailRef}
                      type="email"
                      className={`login-input${fieldErrors.email ? ' login-input-error' : ''}`}
                      placeholder="Username"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setTouched(p => ({ ...p, email: true }))}
                      autoComplete="username"
                      disabled={isLocked || loading}
                    />
                  </div>
                  {fieldErrors.email && (
                    <span className="login-field-error">{fieldErrors.email}</span>
                  )}
                </div>

                {/* Password */}
                <div className="login-field">
                  <label htmlFor="login-password" className="sr-only">Password</label>
                  <div className="login-input-wrap">
                    <Lock size={16} className="login-input-icon" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`login-input login-input-pw${fieldErrors.password ? ' login-input-error' : ''}`}
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onBlur={() => setTouched(p => ({ ...p, password: true }))}
                      autoComplete="current-password"
                      disabled={isLocked || loading}
                    />
                    <button
                      type="button"
                      className="login-pw-toggle"
                      onClick={() => setShowPassword(s => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span className="login-field-error">{fieldErrors.password}</span>
                  )}
                </div>

                {/* Remember me + forgot password */}
                <div className="login-meta-row">
                  <label className="login-checkbox-label" htmlFor="rememberMe">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      className="login-checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      disabled={isLocked || loading}
                    />
                    <span className="login-checkbox-custom" />
                    <span>Remember Me</span>
                  </label>
                  <Link href="/change-password" className="login-forgot-link">
                    Forgot Password?
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  id="login-submit-btn"
                  className="login-btn-primary login-btn-secure"
                  disabled={loading || isLocked}
                >
                  {loading ? (
                    <span className="login-btn-loading">
                      <span className="login-spinner" />
                      Authenticating…
                    </span>
                  ) : (
                    <>Secure Sign In <ChevronRight size={17} strokeWidth={2.5} /></>
                  )}
                </button>
              </form>

              <div className="login-notice">
                <Shield size={13} style={{ flexShrink: 0, color: 'var(--info)' }} />
                <span>
                  Access restricted to authorised Nib Bank personnel. All attempts are
                  monitored and logged for compliance.
                </span>
              </div>
            </>
          )}

          {/* ── STEP: MFA ──────────────────────────────────────── */}
          {step === 'mfa' && (
            <>
              <div className="login-card-header">
                <div className="login-card-icon login-card-icon-mfa">
                  <Fingerprint size={22} />
                </div>
                <h2 className="login-access-title">Two-Factor Verification</h2>
                <p className="login-access-sub">
                  Enter the 6-digit code from your authenticator app to complete sign-in
                  for <strong>{email}</strong>.
                </p>
              </div>

              {serverError && (
                <div className="login-alert login-alert-error" role="alert">
                  <AlertCircle size={15} /><span>{serverError}</span>
                </div>
              )}
              {serverSuccess && (
                <div className="login-alert login-alert-success" role="status">
                  <CheckCircle size={15} /><span>{serverSuccess}</span>
                </div>
              )}

              <form onSubmit={handleMfa} noValidate>
                <div className="login-field" style={{ marginBottom: 6 }}>
                  <label className="login-label" style={{ textAlign: 'center', display: 'block' }}>
                    Authentication Code
                  </label>
                  <MfaCodeInput value={mfaCode} onChange={v => { setMfaCode(v); setFieldErrors(p => ({ ...p, mfa: '' })); }} />
                  {fieldErrors.mfa && (
                    <span className="login-field-error" style={{ textAlign: 'center', display: 'block', marginTop: 6 }}>
                      {fieldErrors.mfa}
                    </span>
                  )}
                </div>

                <p className="login-mfa-hint">
                  <RefreshCw size={11} /> Code refreshes every 30 seconds
                </p>

                <button
                  type="submit"
                  id="mfa-submit-btn"
                  className="login-btn-primary login-btn-secure"
                  disabled={!canSubmitMfa}
                >
                  {loading ? (
                    <span className="login-btn-loading">
                      <span className="login-spinner" />
                      Verifying…
                    </span>
                  ) : (
                    <><Shield size={15} /> Verify &amp; Sign In</>
                  )}
                </button>

                <button
                  type="button"
                  className="login-btn-ghost"
                  onClick={() => { setStep('credentials'); setMfaCode(''); setServerError(''); }}
                >
                  <ArrowLeft size={14} /> Back to Login
                </button>
              </form>

              <div className="login-notice" style={{ marginTop: 16 }}>
                <Shield size={13} style={{ flexShrink: 0, color: 'var(--info)' }} />
                <span>
                  Dev bypass: enter <strong>000000</strong> to skip TOTP validation.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="login-hero-footer">
          <Building2 size={12} />
          <span>
            © {new Date().getFullYear()} Nib International Bank S.C. · For access issues contact{' '}
            <a href="mailto:helpdesk@nibbank.com.et" className="login-footer-link">
              helpdesk@nibbank.com.et
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
