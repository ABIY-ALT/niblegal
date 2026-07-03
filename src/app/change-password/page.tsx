'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const requirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'At least one uppercase letter (A-Z)', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter (a-z)', test: (p: string) => /[a-z]/.test(p) },
  { label: 'At least one number (0-9)', test: (p: string) => /\d/.test(p) },
  { label: 'At least one special character (!@#$...)', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [show, setShow] = useState({ current: false, newPwd: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const strength = requirements.filter(r => r.test(form.newPwd)).length;
  const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#eab308', '#10b981', '#059669'][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.newPwd !== form.confirm) { setError('New passwords do not match.'); return; }
    if (strength < 4) { setError('Password does not meet security requirements.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.newPwd }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to change password.'); return; }
      setSuccess(true);
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ id, label, value, field }: { id: string; label: string; value: string; field: keyof typeof show }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          id={id}
          type={show[field] ? 'text' : 'password'}
          className="form-control"
          value={value}
          onChange={e => setForm(p => ({ ...p, [field === 'current' ? 'current' : field === 'newPwd' ? 'newPwd' : 'confirm']: e.target.value }))}
          style={{ paddingLeft: 40, paddingRight: 44 }}
          required
        />
        <button type="button" onClick={() => setShow(p => ({ ...p, [field]: !p[field] }))} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          {show[field] ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  if (success) return (
    <div className="auth-center-layout">
      <div className="login-card" style={{ textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <CheckCircle size={28} color="var(--success)" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Password Changed</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 14, lineHeight: 1.6 }}>
          Your password has been updated successfully. You will be asked to sign in again with your new credentials.
        </p>
        <Link href="/login" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Back to Sign In
        </Link>
      </div>
    </div>
  );

  return (
    <div className="auth-center-layout">
      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back to Platform
        </Link>

        <div className="login-card">
          <div className="login-card-header">
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--accent-glow)', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShieldCheck size={22} color="var(--accent)" />
            </div>
            <h2>Change Password</h2>
            <p>Create a strong new password that meets bank security requirements.</p>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field id="current" label="Current Password" value={form.current} field="current" />
            <Field id="newPwd" label="New Password" value={form.newPwd} field="newPwd" />

            {/* Password Strength */}
            {form.newPwd && (
              <div style={{ marginTop: -10 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? strengthColor : 'var(--border)', transition: 'all 0.3s' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {requirements.map((r, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <CheckCircle size={13} color={r.test(form.newPwd) ? 'var(--success)' : 'var(--border)'} />
                      <span style={{ color: r.test(form.newPwd) ? 'var(--text-secondary)' : 'var(--text-muted)' }}>{r.label}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, fontWeight: 600, color: strengthColor, marginTop: 4 }}>
                    Strength: {strengthLabel}
                  </div>
                </div>
              </div>
            )}

            <Field id="confirm" label="Confirm New Password" value={form.confirm} field="confirm" />

            {form.confirm && form.newPwd !== form.confirm && (
              <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: -12 }}>Passwords do not match.</div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading || strength < 4 || form.newPwd !== form.confirm} style={{ width: '100%', padding: '12px 24px', fontSize: 14, fontWeight: 600, marginTop: 4 }}>
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
