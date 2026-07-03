'use client';

import { useState } from 'react';
import { USERS } from '@/data/store';
import { ROLE_LABELS } from '@/utils/formatters';
import { Plus, Search, MoreHorizontal, Edit2, ShieldOff, CheckCircle } from 'lucide-react';

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filtered = USERS.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-title">User Accounts ({USERS.length})</span>
        <button className="btn btn-primary btn-sm"><Plus size={14} /> Create User</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search users..." 
            style={{ paddingLeft: 36 }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Security Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{u.email}</td>
                <td style={{ fontSize: 13 }}>{u.department}</td>
                <td><span className="badge" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>{ROLE_LABELS[u.role] || u.role}</span></td>
                <td><span className="badge status-active"><CheckCircle size={10} style={{ display: 'inline', marginRight: 4 }}/> Active</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 6 }} title="Edit User"><Edit2 size={14} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 6, color: 'var(--danger)' }} title="Disable User"><ShieldOff size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
