'use client';

import { useState } from 'react';
import { User, Mail, Building2, Shield, Clock, Edit3, Save, X, Camera, Activity, FileText, Scale, CheckCircle } from 'lucide-react';
import { USERS } from '@/data/store';
import { ROLE_LABELS } from '@/utils/formatters';
import Link from 'next/link';

// In production, this would come from server session/JWT
const MOCK_USER = USERS?.[0] ?? { id: '1', name: 'Tigist Mekonnen', email: 'tigist.mekonnen@nibbank.com.et', role: 'legal_officer' as const, department: 'Legal Department' };

const ACTIVITY_LOG = [
  { action: 'Approved contract NIB-CMS-2026-00003', time: '2 hours ago', type: 'contract', icon: <CheckCircle size={14} color="var(--success)" /> },
  { action: 'Added comment on NIB-LAHD-2026-00002', time: '5 hours ago', type: 'advisory', icon: <Scale size={14} color="var(--gold)" /> },
  { action: 'Uploaded version 2 of NIB-CMS-2026-00001', time: 'Yesterday, 3:45 PM', type: 'contract', icon: <FileText size={14} color="var(--accent)" /> },
  { action: 'Completed Legal Opinion for NIB-LAHD-2026-00001', time: 'Yesterday, 1:10 PM', type: 'advisory', icon: <Scale size={14} color="var(--gold)" /> },
  { action: 'Submitted new contract request NIB-CMS-2026-00005', time: '2 days ago', type: 'contract', icon: <FileText size={14} color="var(--accent)" /> },
  { action: 'Password changed successfully', time: '3 days ago', type: 'security', icon: <Shield size={14} color="var(--info)" /> },
];

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'activity' | 'security'>('info');
  const [profile, setProfile] = useState({ name: MOCK_USER.name, phone: '+251 91 234 5678', bio: 'Senior Legal Officer specializing in contract management and regulatory compliance for Nib International Bank.' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setEditing(false);
  };

  const initials = MOCK_USER.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Profile Header Banner */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: 120, background: 'linear-gradient(135deg, #3B2718 0%, #6C4A28 55%, #EAB308 100%)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 40%)' }} />
        </div>

        <div style={{ padding: '0 32px 24px', position: 'relative' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', display: 'inline-block', marginTop: -40 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--sidebar))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, border: '4px solid var(--bg-card)', boxShadow: 'var(--shadow)' }}>
              {initials}
            </div>
            <button style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-surface)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Camera size={12} color="var(--text-muted)" />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px 0' }}>{MOCK_USER.name}</h2>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="badge status-active" style={{ fontSize: 12 }}>{ROLE_LABELS[MOCK_USER.role]}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Building2 size={13} /> {MOCK_USER.department}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={13} /> {MOCK_USER.email}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/change-password" className="btn btn-secondary btn-sm">
                <Shield size={14} /> Change Password
              </Link>
              {!editing
                ? <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}><Edit3 size={14} /> Edit Profile</button>
                : <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}><X size={14} /> Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}><Save size={14} /> {saving ? 'Saving...' : 'Save'}</button>
                  </div>
              }
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-bar" style={{ marginBottom: 20 }}>
        {[
          { id: 'info', label: 'Profile Info', icon: <User size={15} /> },
          { id: 'activity', label: 'Activity History', icon: <Activity size={15} /> },
          { id: 'security', label: 'Security', icon: <Shield size={15} /> },
        ].map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id as any)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid-2" style={{ gap: 20 }}>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header"><span className="card-title">Personal Information</span></div>
            <div className="form-row cols-2">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-control" value={profile.name} readOnly={!editing} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} style={!editing ? { opacity: 0.8 } : {}} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-control" value={profile.phone} readOnly={!editing} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} style={!editing ? { opacity: 0.8 } : {}} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Bio / Notes</label>
              <textarea className="form-control" rows={3} value={profile.bio} readOnly={!editing} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} style={!editing ? { opacity: 0.8 } : {}} />
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Work Information</span></div>
            {[
              { label: 'Email Address', value: MOCK_USER.email, icon: <Mail size={14} /> },
              { label: 'Department', value: MOCK_USER.department, icon: <Building2 size={14} /> },
              { label: 'Role', value: ROLE_LABELS[MOCK_USER.role], icon: <User size={14} /> },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border-light)' : 'none' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>{f.icon} {f.label}</span>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{f.value}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Activity Summary</span></div>
            {[
              { label: 'Contracts Assigned', value: '12' },
              { label: 'Advisories Handled', value: '8' },
              { label: 'Approvals Made', value: '23' },
              { label: 'Documents Uploaded', value: '34' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border-light)' : 'none' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.label}</span>
                <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent)' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Activity</span><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 30 days</span></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {ACTIVITY_LOG.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < ACTIVITY_LOG.length - 1 ? '1px solid var(--border-light)' : 'none', alignItems: 'flex-start' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                  {entry.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, margin: '0 0 4px', fontWeight: 500 }}>{entry.action}</p>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Clock size={11} /> {entry.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { title: 'Password', desc: 'Last changed 3 days ago', status: 'Good', statusClass: 'status-active', action: <Link href="/change-password" className="btn btn-secondary btn-sm"><Shield size={13}/> Change Password</Link> },
            { title: 'Multi-Factor Authentication', desc: 'Adds an extra layer of security with a TOTP authenticator app.', status: 'Enabled', statusClass: 'status-active', action: <button className="btn btn-secondary btn-sm">Manage MFA</button> },
            { title: 'Active Sessions', desc: 'You are logged in from 1 device.', status: '1 Active', statusClass: 'status-review', action: <button className="btn btn-ghost btn-sm">View Sessions</button> },
            { title: 'Login History', desc: 'Last login: Today at 9:14 AM — Addis Ababa, ET (Chrome on Windows)', status: 'Normal', statusClass: 'status-active', action: <button className="btn btn-ghost btn-sm">Full History</button> },
          ].map((item, i) => (
            <div key={i} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</span>
                  <span className={`badge ${item.statusClass}`}>{item.status}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>{item.desc}</p>
              </div>
              {item.action}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
