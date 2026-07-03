import { useState } from 'react';
import { advisoryRequests } from '../data/store';
import { ADVISORY_STATUS_LABELS, ADVISORY_STATUS_COLORS, ADVISORY_CATEGORY_LABELS, URGENCY_COLORS, formatDateTime, isSLABreached } from '../utils/formatters';
import { Search, Plus, AlertTriangle } from 'lucide-react';
import type { AdvisoryRequest, AdvisoryStatus, AdvisoryCategory } from '../types';

interface Props { onOpen: (a: AdvisoryRequest) => void; onNew: () => void; }

export default function AdvisoryList({ onOpen, onNew }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AdvisoryStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<AdvisoryCategory | ''>('');
  const [urgencyFilter, setUrgencyFilter] = useState('');

  const filtered = advisoryRequests.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.title.toLowerCase().includes(q) || a.id.toLowerCase().includes(q) || a.requestingDepartment.toLowerCase().includes(q);
    const matchStatus = !statusFilter || a.status === statusFilter;
    const matchCategory = !categoryFilter || a.category === categoryFilter;
    const matchUrgency = !urgencyFilter || a.urgency === urgencyFilter;
    return matchSearch && matchStatus && matchCategory && matchUrgency;
  });

  return (
    <div>
      <div className="filters-bar">
        <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
          <Search size={16} />
          <input className="form-control" placeholder="Search advisory requests..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
          <option value="">All Statuses</option>
          {(Object.keys(ADVISORY_STATUS_LABELS) as AdvisoryStatus[]).map(s => <option key={s} value={s}>{ADVISORY_STATUS_LABELS[s]}</option>)}
        </select>
        <select className="form-control" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)}>
          <option value="">All Categories</option>
          {(Object.keys(ADVISORY_CATEGORY_LABELS) as AdvisoryCategory[]).map(c => <option key={c} value={c}>{ADVISORY_CATEGORY_LABELS[c]}</option>)}
        </select>
        <select className="form-control" value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)}>
          <option value="">All Urgency</option>
          {['low', 'medium', 'high', 'critical'].map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
        </select>
        <button className="btn btn-primary" onClick={onNew}><Plus size={15} /> New Request</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Request ID</th><th>Title</th><th>Category</th><th>Department</th><th>Urgency</th><th>Status</th><th>SLA Deadline</th><th>Assigned To</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No advisory requests found</td></tr>
              )}
              {filtered.map(a => {
                const breached = isSLABreached(a.slaDeadline, a.status);
                return (
                  <tr key={a.id} onClick={() => onOpen(a)} style={breached ? { background: 'rgba(239,68,68,0.05)' } : {}}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gold)' }}>{a.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, maxWidth: 240, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {breached && <AlertTriangle size={13} color="var(--danger)" />}
                        {a.title}
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{ADVISORY_CATEGORY_LABELS[a.category]}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.requestingDepartment}</td>
                    <td><span className={`badge ${URGENCY_COLORS[a.urgency]}`}>{a.urgency.toUpperCase()}</span></td>
                    <td><span className={`badge ${ADVISORY_STATUS_COLORS[a.status]}`}>{ADVISORY_STATUS_LABELS[a.status]}</span></td>
                    <td style={{ fontSize: 12, color: breached ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {formatDateTime(a.slaDeadline)}
                    </td>
                    <td style={{ fontSize: 12 }}>{a.assignedOfficer ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
