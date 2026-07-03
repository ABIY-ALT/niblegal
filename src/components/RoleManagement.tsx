'use client';

import { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Edit,
  KeyRound,
  Lock,
  Plus,
  Search,
  Shield,
  Trash2,
  X,
} from 'lucide-react';
import { addRole, deleteRole, roles, updateRole } from '@/data/store';
import type { Permission, Role } from '@/types';
import { formatDate } from '@/utils/formatters';

type PermissionDefinition = {
  id: Permission;
  label: string;
  group: 'menu' | 'action';
};

type PermissionArea = {
  id: string;
  name: string;
  description: string;
  permissions: PermissionDefinition[];
};

type RoleFormData = {
  name: string;
  description: string;
  permissions: Permission[];
};

const PERMISSION_AREAS: PermissionArea[] = [
  {
    id: 'navigation',
    name: 'Menus',
    description: 'Controls the navigation entries a role can access.',
    permissions: [
      { id: 'menu:dashboard', label: 'Dashboard', group: 'menu' },
      { id: 'menu:contracts', label: 'Contracts', group: 'menu' },
      { id: 'menu:advisory', label: 'Legal Advisory', group: 'menu' },
      { id: 'menu:repository', label: 'Repository', group: 'menu' },
      { id: 'menu:expiry', label: 'Expiry', group: 'menu' },
      { id: 'menu:notifications', label: 'Notifications', group: 'menu' },
      { id: 'menu:knowledge', label: 'Knowledge', group: 'menu' },
      { id: 'menu:reports', label: 'Reports', group: 'menu' },
      { id: 'menu:users', label: 'Users', group: 'menu' },
      { id: 'menu:roles', label: 'Roles', group: 'menu' },
      { id: 'menu:admin', label: 'Admin', group: 'menu' },
    ],
  },
  {
    id: 'cms',
    name: 'Contract Management',
    description: 'Actions for contract intake, review, approval, execution, and export.',
    permissions: [
      { id: 'cms:view', label: 'View', group: 'action' },
      { id: 'cms:create', label: 'Create', group: 'action' },
      { id: 'cms:edit', label: 'Edit', group: 'action' },
      { id: 'cms:delete', label: 'Delete', group: 'action' },
      { id: 'cms:review', label: 'Review', group: 'action' },
      { id: 'cms:approve', label: 'Approve', group: 'action' },
      { id: 'cms:execute', label: 'Execute', group: 'action' },
      { id: 'cms:export', label: 'Export', group: 'action' },
    ],
  },
  {
    id: 'lahd',
    name: 'Legal Advisory',
    description: 'Actions for advisory requests, opinions, approvals, and dispatch.',
    permissions: [
      { id: 'lahd:view', label: 'View', group: 'action' },
      { id: 'lahd:create', label: 'Create', group: 'action' },
      { id: 'lahd:edit', label: 'Edit', group: 'action' },
      { id: 'lahd:delete', label: 'Delete', group: 'action' },
      { id: 'lahd:review', label: 'Review', group: 'action' },
      { id: 'lahd:approve', label: 'Approve', group: 'action' },
      { id: 'lahd:dispatch', label: 'Dispatch', group: 'action' },
      { id: 'lahd:export', label: 'Export', group: 'action' },
    ],
  },
  {
    id: 'knowledge',
    name: 'Knowledge Repository',
    description: 'Permissions for legal knowledge, templates, directives, and downloads.',
    permissions: [
      { id: 'knowledge:view', label: 'View', group: 'action' },
      { id: 'knowledge:create', label: 'Create', group: 'action' },
      { id: 'knowledge:edit', label: 'Edit', group: 'action' },
      { id: 'knowledge:delete', label: 'Delete', group: 'action' },
      { id: 'knowledge:download', label: 'Download', group: 'action' },
    ],
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Analytics, dashboards, and report export capabilities.',
    permissions: [
      { id: 'reports:view', label: 'View', group: 'action' },
      { id: 'reports:export', label: 'Export', group: 'action' },
    ],
  },
  {
    id: 'users',
    name: 'User Management',
    description: 'Controls user lifecycle and account support actions.',
    permissions: [
      { id: 'users:view', label: 'View', group: 'action' },
      { id: 'users:create', label: 'Create', group: 'action' },
      { id: 'users:edit', label: 'Edit', group: 'action' },
      { id: 'users:deactivate', label: 'Deactivate', group: 'action' },
      { id: 'users:reset_password', label: 'Reset Password', group: 'action' },
    ],
  },
  {
    id: 'roles',
    name: 'Role Management',
    description: 'Controls RBAC administration and permission design.',
    permissions: [
      { id: 'roles:view', label: 'View', group: 'action' },
      { id: 'roles:create', label: 'Create', group: 'action' },
      { id: 'roles:edit', label: 'Edit', group: 'action' },
      { id: 'roles:delete', label: 'Delete', group: 'action' },
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_AREAS.flatMap(area => area.permissions.map(permission => permission.id));
const ACTION_LABELS = ['View', 'Create', 'Edit', 'Delete', 'Review', 'Approve', 'Execute', 'Dispatch', 'Export', 'Download', 'Deactivate', 'Reset Password'];

const emptyForm: RoleFormData = {
  name: '',
  description: '',
  permissions: [],
};

function getPermissionLabel(permission: Permission) {
  return PERMISSION_AREAS
    .flatMap(area => area.permissions)
    .find(item => item.id === permission)?.label ?? permission;
}

function getPermissionCounts(role: Role) {
  return role.permissions.reduce(
    (counts, permission) => {
      if (permission.startsWith('menu:')) counts.menus += 1;
      else counts.actions += 1;
      return counts;
    },
    { menus: 0, actions: 0 },
  );
}

function includesAll(source: Permission[], permissions: Permission[]) {
  return permissions.every(permission => source.includes(permission));
}

export default function RoleManagement() {
  const [roleList, setRoleList] = useState<Role[]>(roles);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'system' | 'custom'>('all');
  const [activeRoleId, setActiveRoleId] = useState(roleList[0]?.id ?? '');
  const [showEditor, setShowEditor] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormData>(emptyForm);

  const selectedRole = roleList.find(role => role.id === activeRoleId) ?? roleList[0];
  const selectedCounts = selectedRole ? getPermissionCounts(selectedRole) : { menus: 0, actions: 0 };
  const totalMenus = ALL_PERMISSIONS.filter(permission => permission.startsWith('menu:')).length;
  const totalActions = ALL_PERMISSIONS.length - totalMenus;

  const filteredRoles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return roleList.filter(role => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'system' && role.isSystem) ||
        (statusFilter === 'custom' && !role.isSystem);

      const matchesQuery =
        normalizedQuery.length === 0 ||
        role.name.toLowerCase().includes(normalizedQuery) ||
        role.description?.toLowerCase().includes(normalizedQuery) ||
        role.permissions.some(permission => getPermissionLabel(permission).toLowerCase().includes(normalizedQuery));

      return matchesStatus && matchesQuery;
    });
  }, [query, roleList, statusFilter]);

  const syncRoles = () => {
    setRoleList([...roles]);
  };

  const openCreateEditor = (template?: Role) => {
    setEditingRole(null);
    setFormData(
      template
        ? {
            name: `${template.name} Copy`,
            description: template.description ?? '',
            permissions: [...template.permissions],
          }
        : emptyForm,
    );
    setShowEditor(true);
  };

  const openEditEditor = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description ?? '',
      permissions: [...role.permissions],
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingRole(null);
    setFormData(emptyForm);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (editingRole) {
      updateRole(editingRole.id, formData);
      setActiveRoleId(editingRole.id);
    } else {
      addRole(formData);
      setActiveRoleId(roles.at(-1)?.id ?? activeRoleId);
    }

    syncRoles();
    closeEditor();
  };

  const handleDelete = (role: Role) => {
    if (role.isSystem) return;
    const confirmed = window.confirm(`Delete role "${role.name}"? This cannot be undone.`);

    if (!confirmed) return;

    deleteRole(role.id);
    const remainingRoles = roles.filter(item => item.id !== role.id);
    setRoleList([...remainingRoles]);
    setActiveRoleId(remainingRoles[0]?.id ?? '');
  };

  const togglePermission = (permission: Permission) => {
    setFormData(current => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter(item => item !== permission)
        : [...current.permissions, permission],
    }));
  };

  const setAreaPermissions = (area: PermissionArea, checked: boolean) => {
    const areaPermissions = area.permissions.map(permission => permission.id);

    setFormData(current => ({
      ...current,
      permissions: checked
        ? Array.from(new Set([...current.permissions, ...areaPermissions]))
        : current.permissions.filter(permission => !areaPermissions.includes(permission)),
    }));
  };

  const setAllPermissions = (checked: boolean) => {
    setFormData(current => ({
      ...current,
      permissions: checked ? [...ALL_PERMISSIONS] : [],
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={24} color="var(--accent)" /> Role Management
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
            Create roles, assign menu access, and configure action-level permissions.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => openCreateEditor()}>
          <Plus size={16} /> Create Role
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 0 }}>
        <div className="stat-card accent">
          <div className="stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent-hover)' }}>
            <Shield />
          </div>
          <div className="stat-value">{roleList.length}</div>
          <div className="stat-label">Total Roles</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.14)', color: 'var(--success)' }}>
            <Lock />
          </div>
          <div className="stat-value">{roleList.filter(role => role.isSystem).length}</div>
          <div className="stat-label">System Roles</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon" style={{ background: 'rgba(212,168,71,0.16)', color: 'var(--gold-light)' }}>
            <KeyRound />
          </div>
          <div className="stat-value">{ALL_PERMISSIONS.length}</div>
          <div className="stat-label">Available Permissions</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 0.95fr) minmax(0, 1.65fr)', gap: 20, alignItems: 'start' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <div className="search-bar" style={{ marginBottom: 12 }}>
              <Search />
              <input
                className="form-control"
                placeholder="Search roles or permissions"
                value={query}
                onChange={event => setQuery(event.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {(['all', 'system', 'custom'] as const).map(filter => (
                <button
                  key={filter}
                  className={statusFilter === filter ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
                  onClick={() => setStatusFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredRoles.map(role => {
              const counts = getPermissionCounts(role);
              const isActive = selectedRole?.id === role.id;

              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRoleId(role.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 10,
                    padding: 16,
                    border: 'none',
                    borderBottom: '1px solid var(--border-light)',
                    background: isActive ? 'var(--accent-glow)' : 'transparent',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                    <strong style={{ fontSize: 14 }}>{role.name}</strong>
                    <span className={role.isSystem ? 'badge status-approved' : 'badge status-review'}>
                      {role.isSystem ? 'System' : 'Custom'}
                    </span>
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>
                    {role.description || 'No description provided.'}
                  </span>
                  <span style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
                    <span>{counts.menus} menus</span>
                    <span>{counts.actions} actions</span>
                    <span>{role.permissions.length} total</span>
                  </span>
                </button>
              );
            })}

            {filteredRoles.length === 0 && (
              <div className="empty-state" style={{ padding: 32 }}>
                <Shield />
                <p>No roles match your filters.</p>
              </div>
            )}
          </div>
        </div>

        {selectedRole && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{selectedRole.name}</h2>
                  <span className={selectedRole.isSystem ? 'badge status-approved' : 'badge status-review'}>
                    {selectedRole.isSystem ? 'System Role' : 'Custom Role'}
                  </span>
                </div>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>
                  {selectedRole.description || 'No description provided.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openCreateEditor(selectedRole)}>
                  <Copy size={14} /> Duplicate
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => openEditEditor(selectedRole)}>
                  <Edit size={14} /> Edit
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={selectedRole.isSystem}
                  onClick={() => handleDelete(selectedRole)}
                  title={selectedRole.isSystem ? 'System roles cannot be deleted' : 'Delete role'}
                  style={selectedRole.isSystem ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))', gap: 12 }}>
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)' }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{selectedRole.permissions.length}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Assigned Permissions</div>
              </div>
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)' }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{selectedCounts.menus}/{totalMenus}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Menus Enabled</div>
              </div>
              <div style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)' }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{selectedCounts.actions}/{totalActions}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Actions Enabled</div>
              </div>
            </div>

            <div className="table-wrapper" style={{ borderRadius: 'var(--radius-sm)' }}>
              <table>
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Menus</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSION_AREAS.map(area => {
                    const menuPermissions = area.permissions.filter(permission => permission.group === 'menu');
                    const actionPermissions = area.permissions.filter(permission => permission.group === 'action');

                    return (
                      <tr key={area.id} style={{ cursor: 'default' }}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{area.name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{area.description}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {menuPermissions.length > 0 ? menuPermissions.map(permission => (
                              <span
                                key={permission.id}
                                className={selectedRole.permissions.includes(permission.id) ? 'badge status-active' : 'badge'}
                                style={!selectedRole.permissions.includes(permission.id) ? { background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)' } : undefined}
                              >
                                {selectedRole.permissions.includes(permission.id) && <Check size={11} />}
                                {permission.label}
                              </span>
                            )) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No menu permissions</span>}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {actionPermissions.length > 0 ? actionPermissions.map(permission => (
                              <span
                                key={permission.id}
                                className={selectedRole.permissions.includes(permission.id) ? 'badge status-active' : 'badge'}
                                style={!selectedRole.permissions.includes(permission.id) ? { background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-muted)' } : undefined}
                              >
                                {selectedRole.permissions.includes(permission.id) && <Check size={11} />}
                                {permission.label}
                              </span>
                            )) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No action permissions</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 12 }}>
              <CheckCircle2 size={14} color="var(--success)" />
              Last updated {formatDate(selectedRole.updatedAt)}
            </div>
          </div>
        )}
      </div>

      {showEditor && (
        <div className="modal-overlay" onClick={closeEditor}>
          <div className="modal modal-lg" onClick={event => event.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <div>
                  <h3>{editingRole ? 'Edit Role' : 'Create Role'}</h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 12 }}>
                    Configure menus and actions for this role.
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-icon" onClick={closeEditor} aria-label="Close">
                  <X size={16} />
                </button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-row cols-2">
                  <div className="form-group">
                    <label className="form-label">Role Name</label>
                    <input
                      required
                      className="form-control"
                      value={formData.name}
                      onChange={event => setFormData(current => ({ ...current, name: event.target.value }))}
                      placeholder="e.g. Senior Legal Reviewer"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <input
                      className="form-control"
                      value={formData.description}
                      onChange={event => setFormData(current => ({ ...current, description: event.target.value }))}
                      placeholder="What this role is responsible for"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div className="form-label">Permissions Matrix</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {formData.permissions.length} of {ALL_PERMISSIONS.length} permissions selected
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAllPermissions(true)}>
                      Select All
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAllPermissions(false)}>
                      Clear All
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {PERMISSION_AREAS.map(area => {
                    const areaPermissions = area.permissions.map(permission => permission.id);
                    const areaChecked = includesAll(formData.permissions, areaPermissions);
                    const selectedInArea = areaPermissions.filter(permission => formData.permissions.includes(permission)).length;

                    return (
                      <div key={area.id} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <strong style={{ fontSize: 14 }}>{area.name}</strong>
                            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{area.description}</div>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <input
                              type="checkbox"
                              checked={areaChecked}
                              onChange={event => setAreaPermissions(area, event.target.checked)}
                              style={{ width: 15, height: 15, accentColor: 'var(--accent)' }}
                            />
                            {selectedInArea}/{area.permissions.length}
                          </label>
                        </div>

                        {area.id === 'navigation' ? (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, padding: 14 }}>
                            {area.permissions.map(permission => {
                              const checked = formData.permissions.includes(permission.id);

                              return (
                                <label
                                  key={permission.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    minHeight: 38,
                                    padding: '8px 10px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                                    background: checked ? 'var(--accent-glow)' : 'transparent',
                                    cursor: 'pointer',
                                    fontSize: 12,
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => togglePermission(permission.id)}
                                    style={{ width: 15, height: 15, accentColor: 'var(--accent)' }}
                                  />
                                  {permission.label}
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="table-wrapper" style={{ border: 0, borderRadius: 0 }}>
                            <table>
                              <thead>
                                <tr>
                                  {ACTION_LABELS.map(action => (
                                    <th key={action} style={{ textAlign: 'center', padding: '10px 8px' }}>
                                      {action}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                <tr style={{ cursor: 'default' }}>
                                  {ACTION_LABELS.map(action => {
                                    const permission = area.permissions.find(item => item.label === action);
                                    const checked = permission ? formData.permissions.includes(permission.id) : false;

                                    return (
                                      <td key={action} style={{ textAlign: 'center', padding: 10 }}>
                                        {permission ? (
                                          <input
                                            aria-label={`${area.name} ${action}`}
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => togglePermission(permission.id)}
                                            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                                          />
                                        ) : (
                                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={closeEditor}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
