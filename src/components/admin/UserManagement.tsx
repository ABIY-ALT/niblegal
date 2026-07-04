'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, User as UserIcon, Lock, CheckCircle, XCircle, Mail, Building, Search } from 'lucide-react';
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

export default function UserManagement() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [modal, setModal] = useState<null | { id?: string; form: typeof emptyForm }>(null);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: users = [] } = useQuery<AdminUser[]>({ queryKey: ['admin-users'], queryFn: () => getJson('/api/admin/users') });
  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ['admin-roles-min'], queryFn: () => getJson('/api/admin/roles') });
  const { data: depts = [] } = useQuery<Dept[]>({ queryKey: ['departments'], queryFn: () => getJson('/api/advisory/departments') });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const filtered = users.filter((u) => {
    if (filter === 'active' && !u.isActive) return false;
    if (filter === 'inactive' && u.isActive) return false;
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
      setBanner({ kind: 'ok', msg: modal.id ? 'User updated.' : 'User created (temp password: ChangeMe123!).' });
      refresh();
    } catch (e) { setBanner({ kind: 'err', msg: e instanceof Error ? e.message : 'Save failed' }); }
    finally { setBusy(false); }
  }

  async function action(id: string, action: 'toggle-active' | 'reset-password') {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { setBanner({ kind: 'err', msg: json.error || 'Action failed' }); return; }
    if (action === 'reset-password') setBanner({ kind: 'ok', msg: `Password reset to ${json.data.tempPassword}` });
    refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-2"><UserIcon size={24} className="text-accent" /> User Management</h1>
          <p className="text-muted text-sm mt-1">Manage users, roles, and departments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ form: { ...emptyForm, roleId: roles[0]?.id ?? '' } })}><Plus size={16} /> Create User</button>
      </div>

      {banner && <div className={`alert ${banner.kind === 'ok' ? 'alert-success' : 'alert-danger'}`}>{banner.msg}</div>}

      <div className="card p-3 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="form-control pl-9 w-full" placeholder="Search name, email, department" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button key={f} className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-bg-input text-muted text-[11px] uppercase tracking-wider border-b border-border">
              <tr><th className="py-3 px-3">User</th><th className="px-3">Email</th><th className="px-3">Role</th><th className="px-3">Department</th><th className="px-3">Status</th><th className="px-3">Created</th><th className="px-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-bg-surface">
                  <td className="py-3 px-3 font-semibold">{u.name}</td>
                  <td className="px-3">{u.email}</td>
                  <td className="px-3">{u.roleName}</td>
                  <td className="px-3">{u.departmentName ?? '—'}</td>
                  <td className="px-3">
                    <span className={`badge ${u.isActive ? 'status-active' : 'status-terminated'} text-xs flex items-center gap-1 w-fit`}>
                      {u.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}{u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 text-xs">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-3">
                    <div className="flex gap-1.5 justify-end">
                      <button className="btn btn-ghost btn-sm" title="Edit" onClick={() => setModal({ id: u.id, form: { firstName: u.firstName, lastName: u.lastName, email: u.email, roleId: u.roleId, departmentId: u.departmentId ?? '', isActive: u.isActive } })}><Edit size={14} /></button>
                      <button className="btn btn-ghost btn-sm" title="Reset password" onClick={() => action(u.id, 'reset-password')}><Lock size={14} /></button>
                      <button className="btn btn-ghost btn-sm" title={u.isActive ? 'Deactivate' : 'Activate'} onClick={() => action(u.id, 'toggle-active')}>{u.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="card w-full max-w-[500px]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{modal.id ? 'Edit User' : 'Create User'}</h2>
            <div className="flex flex-col gap-4">
              <div className="form-row cols-2">
                <div className="form-group"><label className="form-label">First Name</label><input className="form-control" value={modal.form.firstName} onChange={(e) => setModal({ ...modal, form: { ...modal.form, firstName: e.target.value } })} /></div>
                <div className="form-group"><label className="form-label">Last Name</label><input className="form-control" value={modal.form.lastName} onChange={(e) => setModal({ ...modal, form: { ...modal.form, lastName: e.target.value } })} /></div>
              </div>
              <div className="form-group"><label className="form-label flex items-center gap-1"><Mail size={12} /> Email</label><input type="email" className="form-control" value={modal.form.email} onChange={(e) => setModal({ ...modal, form: { ...modal.form, email: e.target.value } })} /></div>
              <div className="form-row cols-2">
                <div className="form-group"><label className="form-label">Role</label>
                  <select className="form-control" value={modal.form.roleId} onChange={(e) => setModal({ ...modal, form: { ...modal.form, roleId: e.target.value } })}>
                    <option value="">Select role…</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label flex items-center gap-1"><Building size={12} /> Department</label>
                  <select className="form-control" value={modal.form.departmentId} onChange={(e) => setModal({ ...modal, form: { ...modal.form, departmentId: e.target.value } })}>
                    <option value="">— None —</option>
                    {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              {!modal.id && <p className="text-xs text-muted">New users get the temporary password <strong>ChangeMe123!</strong> and should reset it on first login.</p>}
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy || !modal.form.firstName || !modal.form.email || !modal.form.roleId} onClick={save}>{modal.id ? 'Update User' : 'Create User'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
