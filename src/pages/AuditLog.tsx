import { getAllAuditTrail } from '../data/store';
import { formatDateTime } from '../utils/formatters';
import { ShieldCheck, FileText, Scale } from 'lucide-react';
import { useState } from 'react';

const ACTION_ICONS: Record<string, string> = {
  created: '🟢', submitted: '📤', assigned: '👤', reviewed: '🔍',
  approved: '✅', rejected: '❌', returned: '↩️', executed: '📝',
  expired: '⏰', renewed: '🔄', dispatched: '📬', uploaded: '📁',
  commented: '💬', escalated: '🚨',
};

export default function AuditLog() {
  const [moduleFilter, setModuleFilter] = useState<'CMS' | 'LAHD' | ''>('');
  const [actionFilter, setActionFilter] = useState('');
  const all = getAllAuditTrail();

  const filtered = all.filter(e => {
    const matchModule = !moduleFilter || e.module === moduleFilter;
    const matchAction = !actionFilter || e.action === actionFilter;
    return matchModule && matchAction;
  });

  const uniqueActions = [...new Set(all.map(e => e.action))];

  return (
    <div>
      <div className="filters-bar">
        <select className="form-control" value={moduleFilter} onChange={e => setModuleFilter(e.target.value as any)}>
          <option value="">All Modules</option>
          <option value="CMS">Contract Management (CMS)</option>
          <option value="LAHD">Legal Advisory (LAHD)</option>
        </select>
        <select className="form-control" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
          <option value="">All Actions</option>
          {uniqueActions.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>{filtered.length} entries</span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Timestamp</th><th>Module</th><th>Action</th><th>User</th><th>Details</th></tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id}>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDateTime(entry.timestamp)}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                      {entry.module === 'CMS' ? <FileText size={12} color="var(--accent)" /> : <Scale size={12} color="var(--gold)" />}
                      {entry.module}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                      {ACTION_ICONS[entry.action] ?? '•'} {entry.action}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{entry.userName}</td>
                  <td style={{ fontSize: 12.5, color: 'var(--text-secondary)', maxWidth: 360 }}>{entry.details}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No audit entries found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
