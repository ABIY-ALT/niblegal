'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, User, Lock, CheckCircle, XCircle, Mail, Building } from 'lucide-react';
import { users, addUser, updateUser, toggleUserActive, resetUserPassword } from '@/data/store';
import { ROLE_LABELS, formatDate } from '@/utils/formatters';
import type { User, UserRole } from '@/types';

const DEPARTMENTS = ['Legal', 'Operations', 'Finance', 'IT', 'HR', 'Marketing', 'Risk'];

export default function UserManagementPage() {
  const [usersState, setUsersState] = useState(users);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'legal_officer' as UserRole,
    department: 'Legal',
    isActive: true,
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'legal_officer',
      department: 'Legal',
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      isActive: user.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, formData);
      setUsersState([...users]);
    } else {
      addUser(formData);
      setUsersState([...users]);
    }
    setShowModal(false);
  };

  const handleToggleActive = (id: string) => {
    toggleUserActive(id);
    setUsersState([...users]);
  };

  const handleResetPassword = (id: string, name: string) => {
    resetUserPassword(id);
    alert(`Password reset email sent to ${name}`);
  };

  const filteredUsers = usersState.filter(u => {
    if (filter === 'active') return u.isActive;
    if (filter === 'inactive') return !u.isActive;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={24} color="var(--accent)" /> User Management
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
            Manage users, roles, and departments.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Create User
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button
              key={f}
              className={filter === f ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{ROLE_LABELS[user.role]}</td>
                  <td>{user.department}</td>
                  <td>
                    <span
                      className={`badge ${user.isActive ? 'status-active' : 'status-terminated'}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}
                    >
                      {user.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{formatDate(user.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openEditModal(user)}
                        title="Edit User"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleResetPassword(user.id, user.name)}
                        title="Reset Password"
                      >
                        <Lock size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleToggleActive(user.id)}
                        title={user.isActive ? "Deactivate User" : "Activate User"}
                      >
                        {user.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }} onClick={() => setShowModal(false)}>
          <div
            className="card"
            style={{ width: '100%', maxWidth: 500, padding: 24 }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>
              {editingUser ? 'Edit User' : 'Create User'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  required
                  type="text"
                  className="form-control"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Mail size={12} /> Email
                </label>
                <input
                  required
                  type="email"
                  className="form-control"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-row cols-2">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select
                    className="form-control"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
                  >
                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Building size={12} /> Department
                  </label>
                  <select
                    className="form-control"
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
