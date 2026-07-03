import { useState } from 'react';
import { contracts } from '../data/store';
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS, CONTRACT_CATEGORY_LABELS, formatDate, formatCurrency } from '../utils/formatters';
import { Search, Plus, Filter } from 'lucide-react';
import type { Contract, ContractStatus, ContractCategory } from '../types';

interface Props { onOpen: (c: Contract) => void; onNew: () => void; }

export default function ContractsList({ onOpen, onNew }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<ContractCategory | ''>('');

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.title.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.counterparty.toLowerCase().includes(q) || c.requestingDepartment.toLowerCase().includes(q);
    const matchStatus = !statusFilter || c.status === statusFilter;
    const matchCategory = !categoryFilter || c.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <div>
      <div className="filters-bar">
        <div className="search-bar" style={{ flex: 1, minWidth: 220 }}>
          <Search size={16} />
          <input className="form-control" placeholder="Search contracts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
          <option value="">All Statuses</option>
          {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map(s => (
            <option key={s} value={s}>{CONTRACT_STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select className="form-control" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as any)}>
          <option value="">All Categories</option>
          {(Object.keys(CONTRACT_CATEGORY_LABELS) as ContractCategory[]).map(c => (
            <option key={c} value={c}>{CONTRACT_CATEGORY_LABELS[c]}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={onNew}><Plus size={15} /> New Contract</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Contract ID</th><th>Title</th><th>Category</th><th>Counterparty</th>
                <th>Department</th><th>Status</th><th>Expiry</th><th>Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No contracts found</td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} onClick={() => onOpen(c)}>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--gold)' }}>{c.id}</td>
                  <td>
                    <div style={{ fontWeight: 600, maxWidth: 220 }}>{c.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.assignedOfficer ?? 'Unassigned'}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{CONTRACT_CATEGORY_LABELS[c.category]}</td>
                  <td style={{ fontSize: 13 }}>{c.counterparty}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.requestingDepartment}</td>
                  <td><span className={`badge ${CONTRACT_STATUS_COLORS[c.status]}`}>{CONTRACT_STATUS_LABELS[c.status]}</span></td>
                  <td style={{ fontSize: 12, color: c.status === 'expiring_soon' ? 'var(--warning)' : c.status === 'expired' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                    {formatDate(c.expiryDate)}
                  </td>
                  <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{c.value !== undefined ? formatCurrency(c.value, c.currency) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
