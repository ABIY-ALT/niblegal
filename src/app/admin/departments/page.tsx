'use client';

import { useState } from 'react';
import { Building2, Users, Plus, Edit2, Trash2, Search, Filter, Briefcase, Activity, ShieldCheck, Mail, Phone, ChevronRight } from 'lucide-react';

const DEPARTMENTS = [
  { id: 'D01', name: 'Legal Services', head: 'Dr. Tadesse Girma', email: 'legal@nib.bank', staff: 12, budget: '$1.2M', status: 'Active' },
  { id: 'D02', name: 'Information Technology', head: 'Tigist Abebe', email: 'it@nib.bank', staff: 45, budget: '$4.5M', status: 'Active' },
  { id: 'D03', name: 'Finance & Accounts', head: 'Biruk Haile', email: 'finance@nib.bank', staff: 28, budget: '$3.1M', status: 'Active' },
  { id: 'D04', name: 'Human Resources', head: 'Selamawit Wolde', email: 'hr@nib.bank', staff: 15, budget: '$800K', status: 'Active' },
  { id: 'D05', name: 'Operations & Branches', head: 'Alemayehu Tadesse', email: 'ops@nib.bank', staff: 120, budget: '$8.2M', status: 'Active' },
  { id: 'D06', name: 'Compliance & Risk', head: 'Mekdes Alene', email: 'compliance@nib.bank', staff: 8, budget: '$950K', status: 'Review' },
];

export default function DepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0]);

  const filteredDepts = DEPARTMENTS.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.head.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in h-[calc(100vh-100px)]">
      
      {/* ── Header ── */}
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-3 text-primary">
            <Building2 size={24} className="text-accent" /> Organizational Hierarchy
          </h1>
          <p className="text-sm text-muted mt-1">Manage bank departments, divisions, and operational heads.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary">
            <Plus size={16} /> New Department
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="card card-sm border-l-4 border-l-accent">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Total Departments</div>
          <div className="text-2xl font-bold font-mono text-primary">{DEPARTMENTS.length}</div>
        </div>
        <div className="card card-sm border-l-4 border-l-info">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Total Employees</div>
          <div className="text-2xl font-bold font-mono text-primary">
            {DEPARTMENTS.reduce((sum, d) => sum + d.staff, 0)}
          </div>
        </div>
        <div className="card card-sm border-l-4 border-l-success">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Active Divisions</div>
          <div className="text-2xl font-bold font-mono text-primary">5</div>
        </div>
        <div className="card card-sm border-l-4 border-l-warning">
          <div className="text-muted text-[11px] font-bold uppercase tracking-wider mb-2">Under Review</div>
          <div className="text-2xl font-bold font-mono text-primary">1</div>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex gap-6 min-h-0 flex-1">
        
        {/* Left: Data Table */}
        <div className="flex-1 card p-0 flex flex-col overflow-hidden border border-border shadow-sm">
          <div className="p-4 border-b border-border bg-bg-surface flex items-center justify-between gap-4 shrink-0">
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Search departments..." 
                className="form-control pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-ghost btn-sm"><Filter size={16}/> Filter</button>
          </div>
          
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-input text-muted text-xs uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Head / Manager</th>
                  <th className="py-3 px-4">Staff Count</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDepts.map(d => (
                  <tr 
                    key={d.id} 
                    onClick={() => setSelectedDept(d)}
                    className={`hover:bg-card-hover transition-colors cursor-pointer ${selectedDept.id === d.id ? 'bg-accent/5' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-primary flex items-center gap-2">
                        <Building2 size={14} className="text-accent" /> {d.name}
                      </div>
                      <div className="text-xs text-muted font-mono mt-1">{d.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{d.head}</div>
                      <div className="text-xs text-muted mt-1 flex items-center gap-1"><Mail size={10}/> {d.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-muted">
                        <Users size={14}/> {d.staff}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${d.status === 'Active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ChevronRight size={16} className="text-muted ml-auto" />
                    </td>
                  </tr>
                ))}
                {filteredDepts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted">
                      <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                      <p>No departments found matching your search.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Details Panel */}
        {selectedDept && (
          <div className="w-80 shrink-0 card p-0 flex flex-col overflow-hidden border border-border shadow-sm bg-bg-surface">
            <div className="p-6 border-b border-border bg-gradient-to-br from-bg-card to-bg-surface text-center">
              <div className="w-16 h-16 bg-accent/10 text-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 size={32} />
              </div>
              <h2 className="text-xl font-bold text-primary mb-1">{selectedDept.name}</h2>
              <div className="font-mono text-xs text-muted mb-4">{selectedDept.id}</div>
              <span className={`badge ${selectedDept.status === 'Active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                {selectedDept.status}
              </span>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2"><Briefcase size={12}/> Leadership</h3>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center font-bold text-accent-hover shrink-0">
                    {selectedDept.head.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{selectedDept.head}</div>
                    <div className="text-xs text-muted mb-1">Department Head</div>
                    <div className="text-xs text-secondary flex items-center gap-1 mt-2"><Mail size={12}/> {selectedDept.email}</div>
                    <div className="text-xs text-secondary flex items-center gap-1 mt-1"><Phone size={12}/> +251 91 234 5678</div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border w-full" />

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2"><Activity size={12}/> Department Metrics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-bg-card border border-border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold font-mono text-primary">{selectedDept.staff}</div>
                    <div className="text-xs text-muted mt-1">Personnel</div>
                  </div>
                  <div className="bg-bg-card border border-border rounded-lg p-3 text-center">
                    <div className="text-xl font-bold font-mono text-primary">{selectedDept.budget}</div>
                    <div className="text-xs text-muted mt-1">Budget</div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border w-full" />

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-2"><ShieldCheck size={12}/> Compliance Status</h3>
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted">Audit Score</span>
                    <span className="font-bold text-success">94%</span>
                  </div>
                  <div className="w-full bg-bg-input h-2 rounded-full overflow-hidden">
                    <div className="bg-success h-full w-[94%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-bg-card flex gap-2">
              <button className="btn btn-secondary flex-1"><Edit2 size={16}/> Edit</button>
              <button className="btn btn-ghost text-danger px-3"><Trash2 size={16}/></button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
