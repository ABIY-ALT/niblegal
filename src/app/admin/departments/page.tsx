'use client';

import { Building2, Users, Plus, Edit2, Trash2 } from 'lucide-react';

const DEPARTMENTS = [
  { id: 'D01', name: 'Legal Services', head: 'Dr. Tadesse Girma', staff: 12 },
  { id: 'D02', name: 'Information Technology', head: 'Tigist Abebe', staff: 45 },
  { id: 'D03', name: 'Finance & Accounts', head: 'Biruk Haile', staff: 28 },
  { id: 'D04', name: 'Human Resources', head: 'Selamawit Wolde', staff: 15 },
  { id: 'D05', name: 'Operations & Branches', head: 'Alemayehu Tadesse', staff: 120 },
  { id: 'D06', name: 'Compliance & Risk', head: 'Mekdes Alene', staff: 8 },
];

export default function DepartmentsPage() {
  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-title">Bank Departments</span>
        <button className="btn btn-primary btn-sm"><Plus size={14} /> Add Department</button>
      </div>
      
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Dept ID</th>
              <th>Department Name</th>
              <th>Department Head</th>
              <th>Active Staff</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {DEPARTMENTS.map(d => (
              <tr key={d.id}>
                <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-muted)' }}>{d.id}</td>
                <td style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={14} color="var(--accent)" /> {d.name}
                </td>
                <td style={{ fontSize: 13 }}>{d.head}</td>
                <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <Users size={12} style={{ display: 'inline', marginRight: 4 }} /> {d.staff} users
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 6 }}><Edit2 size={14} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: 6, color: 'var(--danger)' }}><Trash2 size={14} /></button>
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
