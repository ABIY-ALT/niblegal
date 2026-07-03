import { useState } from 'react';
import { User, Bell, Shield, Key, Mail, Smartphone, Globe, Lock, Save } from 'lucide-react';
import type { User as UserType } from '../types';
import { ROLE_LABELS } from '../utils/formatters';

interface Props {
  currentUser: UserType;
}

export default function SettingsPage({ currentUser }: Props) {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'preferences'>('profile');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000); // Simulate save
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', minHeight: '600px' }}>
        
        {/* Settings Sidebar */}
        <div style={{ width: '240px', borderRight: '1px solid var(--border)', background: 'var(--bg-surface)', padding: '24px 16px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, paddingLeft: 12 }}>Settings</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'profile', label: 'My Profile', icon: <User size={16} /> },
              { id: 'security', label: 'Security & Access', icon: <Shield size={16} /> },
              { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
              { id: 'preferences', label: 'Preferences', icon: <Globe size={16} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                  background: activeTab === tab.id ? 'var(--accent-glow)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  transition: 'all 0.2s', textAlign: 'left', fontSize: 13
                }}
              >
                <span style={{ color: activeTab === tab.id ? 'var(--accent)' : 'inherit' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settings Content */}
        <div style={{ flex: 1, padding: '32px 40px', background: 'var(--bg-base)' }}>
          <form onSubmit={handleSave} style={{ maxWidth: '600px' }}>
            
            {activeTab === 'profile' && (
              <div className="fade-in">
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>My Profile</h2>
                
                <div style={{ display: 'flex', gap: 24, marginBottom: 32, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 600 }}>
                    {currentUser.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>{currentUser.name}</h3>
                    <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: 13 }}>{ROLE_LABELS[currentUser.role]} • {currentUser.department}</p>
                    <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 12 }}>Change Avatar</button>
                  </div>
                </div>

                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control" defaultValue={currentUser.name} readOnly style={{ opacity: 0.7 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Managed by Bank AD</span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input type="email" className="form-control" defaultValue={currentUser.email} readOnly style={{ paddingLeft: 36, opacity: 0.7 }} />
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input type="text" className="form-control" defaultValue={currentUser.department} readOnly style={{ opacity: 0.7 }} />
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="fade-in">
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>Security & Access</h2>
                
                <div className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', marginBottom: 24, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px 0', fontSize: 15 }}><Lock size={16} color="var(--accent)" /> Multi-Factor Authentication (MFA)</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>Add an extra layer of security to your account by requiring a code from your authenticator app.</p>
                    </div>
                    <div className="badge status-active">Enabled</div>
                  </div>
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                    <button type="button" className="btn btn-secondary btn-sm">Configure MFA</button>
                  </div>
                </div>

                <div className="card" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px 0', fontSize: 15 }}><Key size={16} color="var(--text-muted)" /> Change Password</h4>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>Password policies are enforced via the Bank's Active Directory. You will be redirected to the IAM portal.</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                    <button type="button" className="btn btn-secondary btn-sm">Go to IAM Portal</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="fade-in">
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>Notification Preferences</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { title: 'New Assignments', desc: 'When a contract or advisory is assigned to you', email: true, app: true },
                    { title: 'Status Changes', desc: 'When a request you originated changes status', email: true, app: true },
                    { title: 'SLA Breaches', desc: 'Alerts when SLAs are within 24 hours of breach', email: true, app: true },
                    { title: 'Comments & Mentions', desc: 'When someone tags you or comments on your items', email: false, app: true },
                    { title: 'System Updates', desc: 'Maintenance and platform upgrade notices', email: true, app: false },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: i < 4 ? '1px solid var(--border-light)' : 'none' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{item.desc}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <input type="checkbox" defaultChecked={item.email} /> Email
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <input type="checkbox" defaultChecked={item.app} /> In-App
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="fade-in">
                <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>System Preferences</h2>
                
                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label">Language</label>
                  <select className="form-control" defaultValue="en">
                    <option value="en">English (US)</option>
                    <option value="am">Amharic (አማርኛ)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label className="form-label">Date Format</label>
                  <select className="form-control" defaultValue="gregorian">
                    <option value="gregorian">Gregorian (DD/MM/YYYY)</option>
                    <option value="ethiopian">Ethiopian Calendar</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Default Landing Page</label>
                  <select className="form-control" defaultValue="dashboard">
                    <option value="dashboard">Dashboard</option>
                    <option value="contracts">Contracts List</option>
                    <option value="advisory">Advisory Requests</option>
                  </select>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                <Save size={16} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  );
}
