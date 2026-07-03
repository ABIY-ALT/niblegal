import { contracts, advisoryRequests, USERS } from '../data/store';
import { CONTRACT_STATUS_LABELS, ADVISORY_STATUS_LABELS, ADVISORY_CATEGORY_LABELS, CONTRACT_CATEGORY_LABELS } from '../utils/formatters';
import { BarChart3, TrendingUp, Users, Clock } from 'lucide-react';

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export default function Reports() {
  // CMS by status
  const cmsStatusCounts = Object.fromEntries(
    Object.keys(CONTRACT_STATUS_LABELS).map(s => [s, contracts.filter(c => c.status === s).length])
  );
  const cmsCatCounts = Object.fromEntries(
    Object.keys(CONTRACT_CATEGORY_LABELS).map(c => [c, contracts.filter(x => x.category === c).length])
  );
  const lahdStatusCounts = Object.fromEntries(
    Object.keys(ADVISORY_STATUS_LABELS).map(s => [s, advisoryRequests.filter(r => r.status === s).length])
  );
  const lahdCatCounts = Object.fromEntries(
    Object.keys(ADVISORY_CATEGORY_LABELS).map(c => [c, advisoryRequests.filter(r => r.category === c).length])
  );

  // Officer workload
  const officers = USERS.filter(u => u.role === 'legal_officer');
  const officerCMS = officers.map(o => ({ name: o.name, count: contracts.filter(c => c.assignedOfficer === o.name).length }));
  const officerLAHD = officers.map(o => ({ name: o.name, count: advisoryRequests.filter(r => r.assignedOfficer === o.name).length }));

  const maxCMS = Math.max(...Object.values(cmsStatusCounts), 1);
  const maxLAHD = Math.max(...Object.values(lahdStatusCounts), 1);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* CMS Status */}
        <div className="card">
          <div className="card-header"><span className="card-title"><BarChart3 size={16} style={{ display: 'inline', marginRight: 6 }} />CMS — Contracts by Status</span></div>
          {Object.entries(cmsStatusCounts).map(([s, v]) => (
            <Bar key={s} label={CONTRACT_STATUS_LABELS[s as any]} value={v} max={maxCMS} color="var(--accent)" />
          ))}
        </div>

        {/* LAHD Status */}
        <div className="card">
          <div className="card-header"><span className="card-title"><BarChart3 size={16} style={{ display: 'inline', marginRight: 6 }} />LAHD — Requests by Status</span></div>
          {Object.entries(lahdStatusCounts).map(([s, v]) => (
            <Bar key={s} label={ADVISORY_STATUS_LABELS[s as any]} value={v} max={maxLAHD} color="var(--gold)" />
          ))}
        </div>

        {/* CMS by Category */}
        <div className="card">
          <div className="card-header"><span className="card-title"><TrendingUp size={16} style={{ display: 'inline', marginRight: 6 }} />CMS — Contracts by Category</span></div>
          {Object.entries(cmsCatCounts).filter(([, v]) => v > 0).map(([c, v]) => (
            <Bar key={c} label={CONTRACT_CATEGORY_LABELS[c as any]} value={v} max={contracts.length || 1} color="var(--success)" />
          ))}
        </div>

        {/* LAHD by Category */}
        <div className="card">
          <div className="card-header"><span className="card-title"><TrendingUp size={16} style={{ display: 'inline', marginRight: 6 }} />LAHD — Requests by Category</span></div>
          {Object.entries(lahdCatCounts).filter(([, v]) => v > 0).map(([c, v]) => (
            <Bar key={c} label={ADVISORY_CATEGORY_LABELS[c as any]} value={v} max={advisoryRequests.length || 1} color="var(--info)" />
          ))}
        </div>
      </div>

      {/* Officer Workload */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title"><Users size={16} style={{ display: 'inline', marginRight: 6 }} />Officer Workload — CMS</span></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Officer</th><th>Contracts Assigned</th><th>Active</th><th>Pending Approval</th></tr></thead>
              <tbody>
                {officerCMS.map(o => (
                  <tr key={o.name}>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td>{o.count}</td>
                    <td>{contracts.filter(c => c.assignedOfficer === o.name && c.status === 'active').length}</td>
                    <td>{contracts.filter(c => c.assignedOfficer === o.name && c.status === 'pending_approval').length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title"><Users size={16} style={{ display: 'inline', marginRight: 6 }} />Officer Workload — LAHD</span></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Officer</th><th>Requests Assigned</th><th>Drafting</th><th>Pending Approval</th></tr></thead>
              <tbody>
                {officerLAHD.map(o => (
                  <tr key={o.name}>
                    <td style={{ fontWeight: 600 }}>{o.name}</td>
                    <td>{o.count}</td>
                    <td>{advisoryRequests.filter(r => r.assignedOfficer === o.name && r.status === 'drafting').length}</td>
                    <td>{advisoryRequests.filter(r => r.assignedOfficer === o.name && r.status === 'pending_approval').length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SLA Summary */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><span className="card-title"><Clock size={16} style={{ display: 'inline', marginRight: 6 }} />SLA Compliance Summary</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Advisory Requests', value: advisoryRequests.length, color: 'var(--accent)' },
              { label: 'Within SLA', value: advisoryRequests.filter(r => new Date(r.slaDeadline) > new Date() || ['dispatched','closed'].includes(r.status)).length, color: 'var(--success)' },
              { label: 'SLA Breached', value: advisoryRequests.filter(r => new Date(r.slaDeadline) < new Date() && !['dispatched','closed'].includes(r.status)).length, color: 'var(--danger)' },
              { label: 'Avg Turnaround', value: '38h', color: 'var(--gold)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
