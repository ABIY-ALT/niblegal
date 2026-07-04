'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, Shield, Mail, Hash, Calendar, HardDrive, Key, Link2, 
  Database, ToggleLeft, Activity, Info, Save, Server, ShieldCheck, Play 
} from 'lucide-react';
import { currentUser } from '@/data/store';
import AccessDenied from '@/components/AccessDenied';

const TABS = [
  { id: 'dashboard', label: 'System Dashboard', icon: <Activity size={16} /> },
  { id: 'general', label: 'General Settings', icon: <Settings size={16} /> },
  { id: 'security', label: 'Security & Auth', icon: <Shield size={16} /> },
  { id: 'smtp', label: 'Email (SMTP)', icon: <Mail size={16} /> },
  { id: 'numbering', label: 'Numbering Formats', icon: <Hash size={16} /> },
  { id: 'features', label: 'Feature Flags', icon: <ToggleLeft size={16} /> },
  { id: 'api', label: 'API Management', icon: <Key size={16} /> },
  { id: 'about', label: 'About System', icon: <Info size={16} /> },
];

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const queryClient = useQueryClient();

  const isAdmin = currentUser.role === 'admin';

  const { data, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await fetch('/api/system');
      if (!res.ok) throw new Error('Failed to fetch settings');
      return res.json();
    }
  });

  const saveMutation = useMutation({
    mutationFn: async ({ type, payload }: { type: string, payload: any }) => {
      await fetch('/api/system', {
        method: 'PUT',
        body: JSON.stringify({ type, data: payload })
      });
    },
    onSuccess: () => {
      alert('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    }
  });

  const handleSave = (type: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    
    // Type coercions
    if (type === 'security') {
      ['jwtExpiration', 'sessionTimeout', 'maxLoginAttempts'].forEach(k => {
        if (payload[k]) payload[k] = parseInt(payload[k] as string);
      });
      payload.requireMfa = payload.requireMfa === 'true';
    }
    if (type === 'smtp') {
      if (payload.port) payload.port = parseInt(payload.port as string);
      payload.secure = payload.secure === 'true';
    }
    
    saveMutation.mutate({ type, payload });
  };

  if (!isAdmin) return <AccessDenied />;
  
  if (isLoading) return <div className="p-20 text-center text-muted">Loading System Configuration...</div>;
  if (!data) return <div className="p-20 text-center text-danger">Failed to load settings</div>;

  return (
    <div className="max-w-[1400px] mx-auto flex flex-col h-[calc(100vh-100px)]">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
          <Server size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold m-0 text-primary">System Administration</h1>
          <p className="text-sm text-muted m-0 mt-1">Configure global parameters, security policies, and monitor system health.</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden border border-border rounded-xl bg-bg-surface shadow-sm">
        {/* ── Sidebar ── */}
        <div className="w-64 border-r border-border bg-bg-base overflow-y-auto">
          <div className="p-4 flex flex-col gap-1">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider mb-2 px-2">Configuration Panels</h3>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-left
                  ${activeTab === t.id ? 'bg-accent/10 text-accent' : 'text-secondary hover:bg-card-hover'}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 bg-card overflow-y-auto p-8 relative">
          
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <div className="flex flex-col gap-6 animate-in fade-in">
              <h2 className="text-lg font-bold border-b border-border pb-2 flex items-center gap-2"><Activity size={18}/> System Status</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card card-sm bg-success/5 border-success/20 flex flex-col items-center justify-center text-center p-6">
                  <ShieldCheck size={32} className="text-success mb-2"/>
                  <div className="text-sm font-bold text-primary">Application</div>
                  <div className="text-xs text-success font-bold uppercase">{data.health.status}</div>
                </div>
                <div className="card card-sm bg-info/5 border-info/20 flex flex-col items-center justify-center text-center p-6">
                  <Database size={32} className="text-info mb-2"/>
                  <div className="text-sm font-bold text-primary">Database</div>
                  <div className="text-xs text-info font-bold uppercase">{data.health.database}</div>
                </div>
                <div className="card card-sm flex flex-col items-center justify-center text-center p-6">
                  <HardDrive size={32} className="text-secondary mb-2"/>
                  <div className="text-sm font-bold text-primary">Memory Usage</div>
                  <div className="text-xl font-mono text-primary">{data.health.memoryUsage.toFixed(1)} MB</div>
                </div>
                <div className="card card-sm flex flex-col items-center justify-center text-center p-6">
                  <Clock size={32} className="text-secondary mb-2"/>
                  <div className="text-sm font-bold text-primary">Uptime</div>
                  <div className="text-xl font-mono text-primary">{(data.health.uptime / 3600).toFixed(1)} hrs</div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-bold text-primary mb-3">Recent Application Logs</h3>
                <div className="border border-border rounded-lg overflow-hidden bg-bg-base">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-bg-input text-muted font-semibold">
                      <tr>
                        <th className="py-2 px-3 w-32">Timestamp</th>
                        <th className="py-2 px-3 w-24">Level</th>
                        <th className="py-2 px-3 w-24">Source</th>
                        <th className="py-2 px-3">Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.logs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-card-hover font-mono">
                          <td className="py-2 px-3 text-muted">{new Date(log.createdAt).toLocaleString()}</td>
                          <td className="py-2 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] ${log.level === 'ERROR' ? 'bg-danger/10 text-danger' : log.level === 'WARN' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'}`}>
                              {log.level}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-semibold">{log.source}</td>
                          <td className="py-2 px-3">{log.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="animate-in fade-in max-w-2xl">
              <h2 className="text-lg font-bold border-b border-border pb-2 mb-6 flex items-center gap-2"><Settings size={18}/> General Configuration</h2>
              <form onSubmit={(e) => handleSave('system', e)} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <input name="bankName" defaultValue={data.system?.bankName} className="form-control" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department Name</label>
                    <input name="departmentName" defaultValue={data.system?.departmentName} className="form-control" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">System Name</label>
                  <input name="systemName" defaultValue={data.system?.systemName} className="form-control" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Time Zone</label>
                    <select name="timeZone" defaultValue={data.system?.timeZone} className="form-control">
                      <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (EAT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <input name="currency" defaultValue={data.system?.currency} className="form-control" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary self-start mt-4"><Save size={16}/> Save Changes</button>
              </form>
            </div>
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in max-w-2xl">
              <h2 className="text-lg font-bold border-b border-border pb-2 mb-6 flex items-center gap-2"><Shield size={18}/> Security & Authentication</h2>
              <form onSubmit={(e) => handleSave('security', e)} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">JWT Expiration (Seconds)</label>
                    <input name="jwtExpiration" type="number" defaultValue={data.security?.jwtExpiration} className="form-control" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session Timeout (Seconds)</label>
                    <input name="sessionTimeout" type="number" defaultValue={data.security?.sessionTimeout} className="form-control" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Max Login Attempts</label>
                    <input name="maxLoginAttempts" type="number" defaultValue={data.security?.maxLoginAttempts} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Require MFA globally</label>
                    <select name="requireMfa" defaultValue={data.security?.requireMfa?.toString()} className="form-control">
                      <option value="false">No (Optional per user)</option>
                      <option value="true">Yes (Enforced)</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary self-start mt-4"><Save size={16}/> Save Security Policy</button>
              </form>
            </div>
          )}

          {/* SMTP */}
          {activeTab === 'smtp' && (
            <div className="animate-in fade-in max-w-2xl">
              <h2 className="text-lg font-bold border-b border-border pb-2 mb-6 flex items-center gap-2"><Mail size={18}/> Email (SMTP) Configuration</h2>
              <form onSubmit={(e) => handleSave('smtp', e)} className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="form-group col-span-2">
                    <label className="form-label">SMTP Host</label>
                    <input name="host" defaultValue={data.smtp?.host} className="form-control" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Port</label>
                    <input name="port" type="number" defaultValue={data.smtp?.port} className="form-control" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input name="username" defaultValue={data.smtp?.username} className="form-control" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input name="password" type="password" defaultValue={data.smtp?.password} placeholder="••••••••" className="form-control" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Sender Email</label>
                  <input name="senderEmail" type="email" defaultValue={data.smtp?.senderEmail} className="form-control" required />
                </div>
                <div className="flex gap-3 mt-4">
                  <button type="submit" className="btn btn-primary"><Save size={16}/> Save Settings</button>
                  <button type="button" className="btn btn-secondary"><Play size={16}/> Test Connection</button>
                </div>
              </form>
            </div>
          )}

          {/* API Management */}
          {activeTab === 'api' && (
            <div className="animate-in fade-in">
              <h2 className="text-lg font-bold border-b border-border pb-2 mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2"><Key size={18}/> API Management</span>
                <button className="btn btn-primary btn-sm">Generate New Key</button>
              </h2>
              <p className="text-sm text-secondary mb-4">Manage API keys for third-party integrations (e.g., Core Banking, ERP).</p>
              
              <div className="border border-border rounded-lg overflow-hidden bg-bg-base">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-bg-input text-muted font-semibold text-xs uppercase">
                      <tr>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Key Prefix</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Created</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.apiKeys.length === 0 ? (
                        <tr><td colSpan={5} className="py-8 text-center text-muted">No API keys found.</td></tr>
                      ) : data.apiKeys.map((k: any) => (
                        <tr key={k.id} className="hover:bg-card-hover">
                          <td className="py-3 px-4 font-semibold text-primary">{k.name}</td>
                          <td className="py-3 px-4 font-mono text-muted text-xs">{k.key.substring(0, 8)}...</td>
                          <td className="py-3 px-4">
                            <span className={`badge ${k.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                              {k.isActive ? 'ACTIVE' : 'REVOKED'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted">{new Date(k.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-right">
                            {k.isActive && <button className="btn btn-ghost btn-sm text-danger hover:bg-danger/10">Revoke</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </div>
          )}
          
          {/* About */}
          {activeTab === 'about' && (
            <div className="animate-in fade-in max-w-xl text-center mx-auto mt-20">
              <div className="w-24 h-24 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mx-auto mb-6">
                <ShieldCheck size={48} />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-2">Nib Bank LMS</h2>
              <p className="text-secondary mb-6">Enterprise Legal Management System</p>
              
              <div className="bg-bg-input rounded-lg p-6 border border-border text-sm flex flex-col gap-3 text-left">
                <div className="flex justify-between"><span className="text-muted">Version</span> <strong className="font-mono">1.0.0-rc.4</strong></div>
                <div className="flex justify-between"><span className="text-muted">Build Environment</span> <strong>Production</strong></div>
                <div className="flex justify-between"><span className="text-muted">License Key</span> <strong className="font-mono">NIB-ENT-V1-XXXX</strong></div>
                <div className="flex justify-between"><span className="text-muted">Next.js Framework</span> <strong>v14.2</strong></div>
                <div className="flex justify-between"><span className="text-muted">Database Engine</span> <strong>PostgreSQL 16</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
