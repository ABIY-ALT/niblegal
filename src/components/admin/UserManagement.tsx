'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Lock, CheckCircle, XCircle, Search, Users, UserCheck, UserX, Building2, MoreVertical, Mail, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface AdminUser {
  id: string; name: string; firstName: string; lastName: string; email: string;
  isActive: boolean; roleId: string; roleName: string; departmentId: string | null; departmentName: string | null; createdAt: string;
}
interface Role { id: string; name: string }
interface Dept { id: string; name: string }

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
  return (await res.json()).data as T;
}

const emptyForm = { firstName: '', lastName: '', email: '', roleId: '', departmentId: '', isActive: true };

function ActionMenu({ user, onEdit, onReset, onToggle }: { user: AdminUser; onEdit: () => void; onReset: () => void; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ padding: 6, background: 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }} className="hover:bg-bg-input hover:text-primary">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, width: 180, padding: 5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100 }}>
          <button onClick={() => { onEdit(); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'left' }} className="hover:bg-bg-input hover:text-primary">
            <Edit size={14} /> Edit User
          </button>
          <button onClick={() => { onReset(); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'left' }} className="hover:bg-bg-input hover:text-primary">
            <Lock size={14} /> Reset Password
          </button>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <button onClick={() => { onToggle(); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: user.isActive ? 'var(--danger)' : 'var(--success)', textAlign: 'left' }} className={user.isActive ? 'hover:bg-danger/10' : 'hover:bg-success/10'}>
            {user.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      )}
    </div>
  );
}

function getInitials(name: string) { return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(); }

/* 700-level hues: the 500-level palette these replace rendered white initials at
   1.9–3.7:1, below the 4.5:1 WCAG AA floor. Same hues, all now ≥5:1 on white. */
const AVATAR_COLORS = ['#A16207','#1D4ED8','#15803D','#7E22CE','#C2410C','#0E7490','#BE185D'];
function avatarColor(name: string) { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length; return AVATAR_COLORS[h]; }

export default function UserManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modal, setModal] = useState<null | { id?: string; form: typeof emptyForm }>(null);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: users = [] } = useQuery<AdminUser[]>({ queryKey: ['admin-users'], queryFn: () => getJson('/api/admin/users') });
  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ['admin-roles-min'], queryFn: () => getJson('/api/admin/roles') });
  const { data: depts = [] } = useQuery<Dept[]>({ queryKey: ['departments'], queryFn: () => getJson('/api/advisory/departments') });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const inactiveUsers = users.filter(u => !u.isActive).length;
  const deptCount = new Set(users.map(u => u.departmentId).filter(Boolean)).size;

  const filtered = users.filter(u => {
    if (statusFilter === 'active' && !u.isActive) return false;
    if (statusFilter === 'inactive' && u.isActive) return false;
    if (roleFilter && u.roleId !== roleFilter) return false;
    const q = search.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.departmentName ?? '').toLowerCase().includes(q);
  });

  async function save() {
    if (!modal) return;
    setBusy(true); setBanner(null);
    try {
      const url = modal.id ? `/api/admin/users/${modal.id}` : '/api/admin/users';
      const res = await fetch(url, { method: modal.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(modal.form) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setModal(null);
      setBanner({ kind: 'ok', msg: modal.id ? 'User updated successfully.' : 'User created. Temp password: ChangeMe123!' });
      refresh();
    } catch (e) { setBanner({ kind: 'err', msg: e instanceof Error ? e.message : 'Save failed' }); }
    finally { setBusy(false); }
  }

  async function doAction(id: string, act: 'toggle-active' | 'reset-password') {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: act }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setBanner({ kind: 'err', msg: json.error || 'Action failed' }); return; }
    if (act === 'reset-password') setBanner({ kind: 'ok', msg: `Password reset to: ${json.data?.tempPassword}` });
    refresh();
  }

  const statCards = [
    { label: 'TOTAL USERS', value: totalUsers, icon: <Users size={20} />, color: '#EAB308' },
    { label: 'ACTIVE USERS', value: activeUsers, icon: <UserCheck size={20} />, color: '#16A34A' },
    { label: 'INACTIVE USERS', value: inactiveUsers, icon: <UserX size={20} />, color: '#EF4444' },
    { label: 'DEPARTMENTS', value: deptCount, icon: <Building2 size={20} />, color: '#2563EB' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>User Management</h1>
        <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Create staff accounts and maintain their role and department assignments.</p>
      </div>

      {banner && (
        <div className={`alert ${banner.kind === 'ok' ? 'alert-success' : 'alert-danger'}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{banner.msg}</span>
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit', padding: 0, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid-kpi">
        {statCards.map((s, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: 'var(--shadow-xs)', transition: 'var(--transition)' }} className="hover:shadow-md">
            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters + Add Button */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, email or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 40px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', outline: 'none' }}>
          <option value="">All Roles</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, cursor: 'pointer', outline: 'none' }}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          className="btn btn-primary"
          onClick={() => setModal({ form: { ...emptyForm, roleId: roles[0]?.id ?? '' } })}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', whiteSpace: 'nowrap', borderRadius: 'var(--radius-sm)' }}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' }}>
                {['IDENTITY', 'ROLE', 'DEPARTMENT', 'STATUS', 'JOINED', 'ACTIONS'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: h === 'ACTIONS' ? 'right' : 'left', fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const color = avatarColor(u.name);
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s' }} className="hover:bg-bg-input">
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                            <Mail size={11} /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(234,179,8,0.12)', color: '#B45309', whiteSpace: 'nowrap' }}>
                        <Shield size={11} />{u.roleName}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                      {u.departmentName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Building2 size={13} color="var(--text-muted)" />{u.departmentName}
                        </div>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: u.isActive ? 'rgba(22,163,74,0.12)' : 'rgba(239,68,68,0.12)', color: u.isActive ? '#16A34A' : '#DC2626', whiteSpace: 'nowrap' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.isActive ? '#16A34A' : '#DC2626', display: 'inline-block' }} />
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <ActionMenu
                        user={u}
                        onEdit={() => setModal({ id: u.id, form: { firstName: u.firstName, lastName: u.lastName, email: u.email, roleId: u.roleId, departmentId: u.departmentId ?? '', isActive: u.isActive } })}
                        onReset={() => doAction(u.id, 'reset-password')}
                        onToggle={() => doAction(u.id, 'toggle-active')}
                      />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  <Users size={32} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
                  No users found matching your filters.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Showing <strong>{filtered.length}</strong> of <strong>{totalUsers}</strong> users</span>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20, backdropFilter: 'blur(4px)' }} onClick={() => setModal(null)}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{modal.id ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', lineHeight: 1, padding: 4 }}>×</button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-row cols-2" style={{ gap: 14 }}>
                <div className="form-group"><label className="form-label">First Name</label><input className="form-control" placeholder="First name" value={modal.form.firstName} onChange={e => setModal({ ...modal, form: { ...modal.form, firstName: e.target.value } })} /></div>
                <div className="form-group"><label className="form-label">Last Name</label><input className="form-control" placeholder="Last name" value={modal.form.lastName} onChange={e => setModal({ ...modal, form: { ...modal.form, lastName: e.target.value } })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Email Address</label><input type="email" className="form-control" placeholder="name@nibbank.com.et" value={modal.form.email} onChange={e => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} /></div>
              <div className="form-row cols-2" style={{ gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" value={modal.form.roleId} onChange={e => setModal({ ...modal, form: { ...modal.form, roleId: e.target.value } })}>
                    <option value="">Select role…</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-control" value={modal.form.departmentId} onChange={e => setModal({ ...modal, form: { ...modal.form, departmentId: e.target.value } })}>
                    <option value="">— None —</option>
                    {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              {!modal.id && <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, padding: '10px 12px', background: 'var(--bg-input)', borderRadius: 8 }}>New users will receive the temporary password <strong>ChangeMe123!</strong> and must reset it on first login.</p>}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy || !modal.form.firstName || !modal.form.email || !modal.form.roleId} onClick={save}>
                {busy ? 'Saving…' : modal.id ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
