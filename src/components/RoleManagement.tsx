'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Edit, KeyRound, Plus, Search, Shield, Trash2, X, Users } from 'lucide-react';

interface ApiRole {
  id: string;
  name: string;
  userCount: number;
  permissions: string[];   // permission names
  permissionIds: string[];
}
interface ApiPermission {
  id: string;
  name: string;
  description: string | null;
  group: string;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Request failed');
  return (await res.json()).data as T;
}

export default function RoleManagement() {
  const qc = useQueryClient();
  const [query, setQuery] = useState('');
  const [activeRoleId, setActiveRoleId] = useState('');
  const [editor, setEditor] = useState<null | { mode: 'create' | 'edit'; id?: string; name: string; permissionIds: Set<string> }>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: roles = [] } = useQuery<ApiRole[]>({ queryKey: ['admin-roles'], queryFn: () => getJson('/api/admin/roles') });
  const { data: permissions = [] } = useQuery<ApiPermission[]>({ queryKey: ['admin-permissions'], queryFn: () => getJson('/api/admin/permissions') });

  const groups = useMemo(() => {
    const m = new Map<string, ApiPermission[]>();
    for (const p of permissions) { if (!m.has(p.group)) m.set(p.group, []); m.get(p.group)!.push(p); }
    return [...m.entries()];
  }, [permissions]);

  const selectedRole = roles.find((r) => r.id === activeRoleId) ?? roles[0];
  const filtered = roles.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-roles'] });

  async function save() {
    if (!editor) return;
    setBusy(true); setError(null);
    try {
      const body = JSON.stringify({ name: editor.name, permissionIds: [...editor.permissionIds] });
      const url = editor.mode === 'edit' ? `/api/admin/roles/${editor.id}` : '/api/admin/roles';
      const res = await fetch(url, { method: editor.mode === 'edit' ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setEditor(null);
      refresh();
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setBusy(false); }
  }

  async function remove(role: ApiRole) {
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    setError(null);
    const res = await fetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' });
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error || 'Delete failed'); return; }
    if (activeRoleId === role.id) setActiveRoleId('');
    refresh();
  }

  const togglePerm = (id: string) => setEditor((e) => {
    if (!e) return e;
    const next = new Set(e.permissionIds);
    next.has(id) ? next.delete(id) : next.add(id);
    return { ...e, permissionIds: next };
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-2"><Shield size={24} className="text-accent" /> Role Management</h1>
          <p className="text-muted text-sm mt-1">Create roles and configure permissions across CMS, Advisory, Knowledge, Reports, and Administration.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditor({ mode: 'create', name: '', permissionIds: new Set() })}><Plus size={16} /> Create Role</button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="card card-sm"><div className="flex justify-between"><span className="text-muted text-[10px] font-bold uppercase tracking-wider">Total Roles</span><Shield size={16} className="text-accent opacity-60" /></div><div className="text-2xl font-bold font-mono">{roles.length}</div></div>
        <div className="card card-sm"><div className="flex justify-between"><span className="text-muted text-[10px] font-bold uppercase tracking-wider">Permissions</span><KeyRound size={16} className="text-accent opacity-60" /></div><div className="text-2xl font-bold font-mono">{permissions.length}</div></div>
        <div className="card card-sm"><div className="flex justify-between"><span className="text-muted text-[10px] font-bold uppercase tracking-wider">Assigned Users</span><Users size={16} className="text-accent opacity-60" /></div><div className="text-2xl font-bold font-mono">{roles.reduce((s, r) => s + r.userCount, 0)}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.7fr)] gap-5 items-start">
        {/* Role list */}
        <div className="card p-0 overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input className="form-control pl-9 w-full" placeholder="Search roles" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col">
            {filtered.map((role) => (
              <button key={role.id} onClick={() => setActiveRoleId(role.id)}
                className={`flex flex-col gap-2 p-4 border-b border-border text-left ${selectedRole?.id === role.id ? 'bg-accent/10' : 'hover:bg-bg-surface'}`}>
                <div className="flex justify-between items-center gap-2">
                  <strong className="text-sm">{role.name}</strong>
                  <span className="badge bg-bg-input text-xs">{role.userCount} users</span>
                </div>
                <span className="text-muted text-xs">{role.permissions.length} permissions</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="p-8 text-center text-muted text-sm">No roles match.</div>}
          </div>
        </div>

        {/* Role detail */}
        {selectedRole && (
          <div className="card flex flex-col gap-5">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-bold m-0">{selectedRole.name}</h2>
                <p className="text-muted text-sm mt-1">{selectedRole.permissions.length} of {permissions.length} permissions · {selectedRole.userCount} user(s)</p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditor({ mode: 'edit', id: selectedRole.id, name: selectedRole.name, permissionIds: new Set(selectedRole.permissionIds) })}><Edit size={14} /> Edit</button>
                <button className="btn btn-ghost btn-sm text-danger" disabled={selectedRole.userCount > 0} title={selectedRole.userCount > 0 ? 'Reassign users before deleting' : 'Delete role'} onClick={() => remove(selectedRole)}><Trash2 size={14} /> Delete</button>
              </div>
            </div>
            <div className="table-wrapper rounded-md">
              <table className="w-full text-sm">
                <thead><tr><th className="text-left py-2 px-3">Module</th><th className="text-left py-2 px-3">Permissions</th></tr></thead>
                <tbody>
                  {groups.map(([group, perms]) => (
                    <tr key={group} className="border-t border-border">
                      <td className="py-3 px-3 font-semibold align-top">{group}</td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1.5">
                          {perms.map((p) => {
                            const on = selectedRole.permissions.includes(p.name);
                            return (
                              <span key={p.id} title={p.description ?? ''}
                                className={`badge text-[11px] flex items-center gap-1 ${on ? 'status-active' : ''}`}
                                style={on ? undefined : { background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                {on && <Check size={11} />}{p.name.split('.')[1] ?? p.name}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Editor modal */}
      {editor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditor(null)}>
          <div className="card w-[640px] max-w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
              <h3 className="font-semibold m-0">{editor.mode === 'edit' ? 'Edit Role' : 'Create Role'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditor(null)}><X size={16} /></button>
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Role Name</label>
              <input className="form-control" value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })} placeholder="e.g. Senior Legal Reviewer" />
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="form-label m-0">Permissions ({editor.permissionIds.size}/{permissions.length})</span>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditor({ ...editor, permissionIds: new Set(permissions.map((p) => p.id)) })}>Select All</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditor({ ...editor, permissionIds: new Set() })}>Clear</button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {groups.map(([group, perms]) => (
                <div key={group} className="border border-border rounded-md overflow-hidden">
                  <div className="bg-bg-input px-3 py-2 font-semibold text-sm border-b border-border">{group}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                    {perms.map((p) => {
                      const checked = editor.permissionIds.has(p.id);
                      return (
                        <label key={p.id} className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer text-xs ${checked ? 'border-accent bg-accent/10' : 'border-border'}`}>
                          <input type="checkbox" checked={checked} onChange={() => togglePerm(p.id)} style={{ accentColor: 'var(--accent)' }} />
                          <span><strong>{p.name}</strong>{p.description ? <span className="text-muted"> — {p.description}</span> : null}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
              <button className="btn btn-ghost" onClick={() => setEditor(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={busy || !editor.name.trim()} onClick={save}>{editor.mode === 'edit' ? 'Update Role' : 'Create Role'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
