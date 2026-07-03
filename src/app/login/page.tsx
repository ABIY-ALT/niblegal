'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Eye, EyeOff, Lock, Mail, Shield, ChevronRight,
  Building2, AlertCircle, CheckCircle, Clock,
  Fingerprint, ArrowLeft, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setCurrentUser, USERS } from '@/data/store';

// ── Types ─────────────────────────────────────────────────────────────────────
type Step = 'credentials' | 'mfa';
type FieldErrors = { email?: string; password?: string; mfa?: string };

// ── Helpers ───────────────────────────────────────────────────────────────────
function validateEmail(v: string) {
  if (!v.trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.';
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

// ── Feature bullets ───────────────────────────────────────────────────────────
const FEATURES = [
  'Secure Role-Based Access Control',
  'End-to-End Contract Lifecycle Management',
  'SLA-Tracked Legal Advisory (LAHD)',
  'Full Audit Trail & Compliance Reporting',
  'Multi-Factor Authentication Ready',
];

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

// ── Main component ────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
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

      if (data.user) setCurrentUser(data.user.id);
      setServerSuccess('Sign-in successful! Redirecting…');
      setTimeout(() => router.push('/dashboard'), 600);
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
      if (data.user) setCurrentUser(data.user.id);
      setServerSuccess('Verification successful! Redirecting…');
      setTimeout(() => router.push('/dashboard'), 600);
    } catch {
      setServerError('MFA verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmitMfa = mfaCode.length === 6 && !loading;

  // ── Sample users for quick-fill ────────────────────────────────────────────
  const sampleUsers = USERS.slice(0, 4).map(u => ({ email: u.email, label: u.name, role: (u as Record<string,unknown>).role as string }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="login-page">
      <div className="login-bg-pattern" />

      {/* Animated orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />

      <div className="login-wrapper">
        {/* ── Left brand panel ───────────────────────────────────────── */}
        <div className="login-brand">
          <div className="login-brand-content">

            {/* Logo */}
            <div className="login-logo-wrap">
              <div className="login-logo-icon">
                <span>N</span>
              </div>
              <div className="login-logo-divider">
                <div className="login-logo-line" />
                <span className="login-logo-text">NIB BANK</span>
                <div className="login-logo-line" />
              </div>
            </div>

            <h1 className="login-brand-title">
              Nib International<br />Bank S.C.
            </h1>
            <p className="login-brand-desc">
              Legal Department Automation Platform — Centralized Contract Management
              &amp; Legal Advisory Help Desk System.
            </p>

            {/* Feature list */}
            <ul className="login-feature-list">
              {FEATURES.map((f, i) => (
                <li key={i} className="login-feature-item">
                  <span className="login-feature-dot">
                    <ChevronRight size={11} />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* Security badge */}
            <div className="login-security-badge">
              <Shield size={14} />
              <span>256-bit TLS encryption · ISO 27001 aligned · GDPR ready</span>
            </div>
          </div>

          <div className="login-brand-footer">
            © {new Date().getFullYear()} Nib International Bank S.C. All rights reserved.
          </div>
        </div>

        {/* ── Right form panel ───────────────────────────────────────── */}
        <div className="login-form-panel">
          <div className="login-card">

            {/* ── STEP: Credentials ─────────────────────────────────── */}
            {step === 'credentials' && (
              <>
                <div className="login-card-header">
                  <div className="login-card-icon">
                    <Lock size={22} />
                  </div>
                  <h2>Welcome Back</h2>
                  <p>Sign in with your Nib Bank credentials to access the Legal Platform.</p>
                </div>

                {/* Lock banner */}
                {isLocked && lockRemainingMs > 0 && (
                  <LockBanner remainingMs={lockRemainingMs} />
                )}

                {/* Server error */}
                {serverError && !isLocked && (
                  <div className="login-alert login-alert-error" role="alert">
                    <AlertCircle size={15} />
                    <span>{serverError}</span>
                    {attemptsLeft !== null && attemptsLeft > 0 && (
                      <span className="login-attempts-badge">{attemptsLeft} left</span>
                    )}
                  </div>
                )}

                {/* Server success */}
                {serverSuccess && (
                  <div className="login-alert login-alert-success" role="status">
                    <CheckCircle size={15} />
                    <span>{serverSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} noValidate>
                  {/* Email */}
                  <div className="login-field">
                    <label htmlFor="login-email" className="login-label">
                      Email / Username
                    </label>
                    <div className="login-input-wrap">
                      <Mail size={15} className="login-input-icon" />
                      <input
                        id="login-email"
                        ref={emailRef}
                        type="email"
                        className={`login-input${fieldErrors.email ? ' login-input-error' : ''}`}
                        placeholder="your.name@nibbank.com.et"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onBlur={() => setTouched(p => ({ ...p, email: true }))}
                        autoComplete="email"
                        disabled={isLocked || loading}
                      />
                    </div>
                    {fieldErrors.email && (
                      <span className="login-field-error">{fieldErrors.email}</span>
                    )}
                  </div>

                  {/* Password */}
                  <div className="login-field">
                    <div className="login-label-row">
                      <label htmlFor="login-password" className="login-label">Password</label>
                      <Link href="/change-password" className="login-forgot-link" tabIndex={-1}>
                        Forgot password?
                      </Link>
                    </div>
                    <div className="login-input-wrap">
                      <Lock size={15} className="login-input-icon" />
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        className={`login-input login-input-pw${fieldErrors.password ? ' login-input-error' : ''}`}
                        placeholder="Enter your password"
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

                  {/* Remember me */}
                  <div className="login-remember-row">
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
                      <span>Remember me for 30 days</span>
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    id="login-submit-btn"
                    className="login-btn-primary"
                    disabled={loading || isLocked}
                  >
                    {loading ? (
                      <span className="login-btn-loading">
                        <span className="login-spinner" />
                        Authenticating…
                      </span>
                    ) : (
                      <>
                        <Lock size={15} />
                        Sign In to Platform
                      </>
                    )}
                  </button>
                </form>

                {/* Quick-fill sample users */}
                <div className="login-sample-box">
                  <p className="login-sample-title">
                    <span className="login-sample-dot" />
                    Sample accounts (local dev)
                  </p>
                  <div className="login-sample-list">
                    {sampleUsers.map(u => (
                      <button
                        key={u.email}
                        type="button"
                        className="login-sample-btn"
                        onClick={() => { setEmail(u.email); setPassword('password'); setTouched({ email: true, password: true }); }}
                      >
                        <span className="login-sample-avatar">{u.label[0]}</span>
                        <span className="login-sample-info">
                          <strong>{u.label}</strong>
                          <small>{u.email}</small>
                        </span>
                        <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
                      </button>
                    ))}
                  </div>
                  <p className="login-sample-hint">Any password works in dev mode.</p>
                </div>

                {/* MFA notice */}
                <div className="login-notice">
                  <Shield size={13} style={{ flexShrink: 0, color: 'var(--info)' }} />
                  <span>
                    Access restricted to authorised Nib Bank personnel. All attempts are
                    monitored and logged for compliance.
                  </span>
                </div>
              </>
            )}

            {/* ── STEP: MFA ─────────────────────────────────────────── */}
            {step === 'mfa' && (
              <>
                <div className="login-card-header">
                  <div className="login-card-icon login-card-icon-mfa">
                    <Fingerprint size={22} />
                  </div>
                  <h2>Two-Factor Verification</h2>
                  <p>
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
                    className="login-btn-primary"
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
          <div className="login-footer">
            <Building2 size={12} />
            <span>
              For access issues, contact IT Helpdesk at ext.&nbsp;0000 or{' '}
              <a href="mailto:helpdesk@nibbank.com.et" className="login-footer-link">
                helpdesk@nibbank.com.et
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
