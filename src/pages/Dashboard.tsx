import { contracts, advisoryRequests, getCMSStats, getLAHDStats } from '../data/store';
import { formatDate, formatDateTime, timeAgo, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS, ADVISORY_STATUS_LABELS, ADVISORY_STATUS_COLORS, URGENCY_COLORS } from '../utils/formatters';
import { FileText, Scale, AlertTriangle, Clock, CheckCircle, TrendingUp, Calendar, Zap } from 'lucide-react';
import type { Contract, AdvisoryRequest } from '../types';

interface Props {
  onOpenContract: (c: Contract) => void;
  onOpenAdvisory: (a: AdvisoryRequest) => void;
  onNavigate: (p: any) => void;
}

export default function Dashboard({ onOpenContract, onOpenAdvisory, onNavigate }: Props) {
  const cms = getCMSStats();
  const lahd = getLAHDStats();
  const recentContracts = [...contracts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const recentAdvisory = [...advisoryRequests].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const alerts = [
    ...contracts.filter(c => c.status === 'expiring_soon').map(c => ({ type: 'warning' as const, msg: `Contract "${c.title}" expires on ${formatDate(c.expiryDate)}`, id: c.id })),
    ...contracts.filter(c => c.status === 'expired').map(c => ({ type: 'danger' as const, msg: `Contract "${c.title}" has expired — renewal required`, id: c.id })),
    ...advisoryRequests.filter(r => {
      const now = new Date();
      return !['dispatched', 'closed'].includes(r.status) && new Date(r.slaDeadline) < now;
    }).map(r => ({ type: 'danger' as const, msg: `SLA BREACHED: Advisory "${r.title}"`, id: r.id })),
  ];

  return (
    <div>
      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.slice(0, 3).map((a, i) => (
            <div key={i} className={`alert alert-${a.type}`}>
              <AlertTriangle size={16} />
              <span>{a.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* CMS Stats */}
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Contract Management</div>
      <div className="stat-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card accent">
          <div className="stat-icon" style={{ background: 'rgba(37,99,235,0.15)' }}><FileText size={20} color="var(--accent)" /></div>
          <div className="stat-value">{cms.totalContracts}</div>
          <div className="stat-label">Total Contracts</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><CheckCircle size={20} color="var(--success)" /></div>
          <div className="stat-value">{cms.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><Clock size={20} color="var(--warning)" /></div>
          <div className="stat-value">{cms.expiringSoon}</div>
          <div className="stat-label">Expiring Soon</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><AlertTriangle size={20} color="var(--danger)" /></div>
          <div className="stat-value">{cms.expired}</div>
          <div className="stat-label">Expired</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon" style={{ background: 'rgba(212,168,71,0.15)' }}><TrendingUp size={20} color="var(--gold)" /></div>
          <div className="stat-value">{cms.pendingApproval}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><FileText size={20} color="var(--info)" /></div>
          <div className="stat-value">{cms.draftCount}</div>
          <div className="stat-label">Drafts</div>
        </div>
      </div>

      {/* LAHD Stats */}
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Legal Advisory (LAHD)</div>
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        <div className="stat-card accent">
          <div className="stat-icon" style={{ background: 'rgba(37,99,235,0.15)' }}><Scale size={20} color="var(--accent)" /></div>
          <div className="stat-value">{lahd.totalRequests}</div>
          <div className="stat-label">Total Requests</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><Zap size={20} color="var(--warning)" /></div>
          <div className="stat-value">{lahd.open}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><CheckCircle size={20} color="var(--success)" /></div>
          <div className="stat-value">{lahd.dispatched}</div>
          <div className="stat-label">Dispatched</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><AlertTriangle size={20} color="var(--danger)" /></div>
          <div className="stat-value">{lahd.slaBreached}</div>
          <div className="stat-label">SLA Breached</div>
        </div>
        <div className="stat-card info">
          <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.15)' }}><Calendar size={20} color="var(--info)" /></div>
          <div className="stat-value">{lahd.avgTurnaroundHours}h</div>
          <div className="stat-label">Avg Turnaround</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon" style={{ background: 'rgba(212,168,71,0.15)' }}><TrendingUp size={20} color="var(--gold)" /></div>
          <div className="stat-value">{lahd.pendingApproval}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-title"><FileText size={16} style={{ display: 'inline', marginRight: 6 }} />Recent Contracts</span>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('contracts')}>View All</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Updated</th></tr></thead>
              <tbody>
                {recentContracts.map(c => (
                  <tr key={c.id} onClick={() => onOpenContract(c)}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{c.id}</td>
                    <td style={{ maxWidth: 200 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.counterparty}</div>
                    </td>
                    <td><span className={`badge ${CONTRACT_STATUS_COLORS[c.status]}`}>{CONTRACT_STATUS_LABELS[c.status]}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{timeAgo(c.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><Scale size={16} style={{ display: 'inline', marginRight: 6 }} />Recent Advisory</span>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('advisory')}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentAdvisory.map(a => (
              <div key={a.id} className="card card-sm" style={{ cursor: 'pointer', padding: '12px 16px' }} onClick={() => onOpenAdvisory(a)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{a.id}</div>
                  </div>
                  <span className={`badge ${URGENCY_COLORS[a.urgency]}`}>{a.urgency.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <span className={`badge ${ADVISORY_STATUS_COLORS[a.status]}`}>{ADVISORY_STATUS_LABELS[a.status]}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{timeAgo(a.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
