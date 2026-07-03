import { useState } from 'react';
import { advanceContractStatus, addContractComment, contracts as storeContracts } from '../data/store';
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS, CONTRACT_CATEGORY_LABELS, formatDate, formatDateTime, formatCurrency, timeAgo } from '../utils/formatters';
import { ArrowLeft, CheckCircle, Send, Clock, FileText } from 'lucide-react';
import type { Contract, User as UserType, ContractStatus } from '../types';
import { generateComment } from '../data/store';

interface Props { contract: Contract; onBack: () => void; currentUser: UserType; }

const WORKFLOW_TRANSITIONS: Record<ContractStatus, { label: string; next: ContractStatus; btnClass: string }[]> = {
  draft: [{ label: 'Submit for Review', next: 'under_review', btnClass: 'btn-primary' }],
  under_review: [{ label: 'Submit for Approval', next: 'pending_approval', btnClass: 'btn-primary' }, { label: 'Return to Draft', next: 'draft', btnClass: 'btn-warning' }],
  pending_approval: [{ label: 'Approve', next: 'approved', btnClass: 'btn-success' }, { label: 'Reject / Return', next: 'under_review', btnClass: 'btn-danger' }],
  approved: [{ label: 'Mark Executed', next: 'executed', btnClass: 'btn-success' }],
  executed: [{ label: 'Mark Active', next: 'active', btnClass: 'btn-primary' }],
  active: [{ label: 'Mark Expiring Soon', next: 'expiring_soon', btnClass: 'btn-warning' }, { label: 'Renew', next: 'renewed', btnClass: 'btn-success' }],
  expiring_soon: [{ label: 'Renew', next: 'renewed', btnClass: 'btn-success' }, { label: 'Mark Expired', next: 'expired', btnClass: 'btn-danger' }],
  expired: [{ label: 'Renew', next: 'renewed', btnClass: 'btn-success' }, { label: 'Terminate', next: 'terminated', btnClass: 'btn-danger' }],
  terminated: [],
  renewed: [{ label: 'Mark Active', next: 'active', btnClass: 'btn-primary' }],
};

export default function ContractDetail({ contract: initialContract, onBack, currentUser }: Props) {
  const [contract, setContract] = useState(initialContract);
  const [tab, setTab] = useState<'details' | 'audit' | 'comments' | 'versions'>('details');
  const [comment, setComment] = useState('');

  const refresh = () => {
    const updated = storeContracts.find((c: Contract) => c.id === contract.id);
    if (updated) setContract({ ...updated });
  };

  const handleTransition = (next: ContractStatus) => {
    advanceContractStatus(contract.id, next, currentUser);
    refresh();
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    addContractComment(contract.id, generateComment(currentUser.id, currentUser.name, currentUser.role, comment.trim()));
    setComment('');
    refresh();
  };

  const transitions = WORKFLOW_TRANSITIONS[contract.status] ?? [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={15} /> Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--gold)' }}>{contract.id}</span>
            <span className={`badge ${CONTRACT_STATUS_COLORS[contract.status]}`}>{CONTRACT_STATUS_LABELS[contract.status]}</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{contract.title}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{contract.counterparty} · {CONTRACT_CATEGORY_LABELS[contract.category]}</p>
        </div>
        {transitions.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            {transitions.map(t => (
              <button key={t.next} className={`btn ${t.btnClass} btn-sm`} onClick={() => handleTransition(t.next)}>{t.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* SLA Alert */}
      {contract.slaDeadline && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <Clock size={16} />
          <span>SLA Deadline: <strong>{formatDateTime(contract.slaDeadline)}</strong></span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        {(['details', 'audit', 'comments', 'versions'] as const).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'audit' ? 'Audit Trail' : t === 'comments' ? `Comments` : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'comments' && <span className="tab-count">{contract.comments.length}</span>}
            {t === 'versions' && <span className="tab-count">{contract.versions.length}</span>}
            {t === 'audit' && <span className="tab-count">{contract.auditTrail.length}</span>}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {tab === 'details' && (
        <div className="detail-grid">
          <div className="detail-col">
            <div className="card">
              <div className="card-header"><span className="card-title">Contract Information</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Category', value: CONTRACT_CATEGORY_LABELS[contract.category] },
                  { label: 'Counterparty', value: contract.counterparty },
                  { label: 'Requesting Department', value: contract.requestingDepartment },
                  { label: 'Requested By', value: contract.requestedBy },
                  { label: 'Assigned Officer', value: contract.assignedOfficer ?? '—' },
                  { label: 'Reviewed By', value: contract.reviewedBy ?? '—' },
                  { label: 'Approved By', value: contract.approvedBy ?? '—' },
                ].map(f => (
                  <div key={f.label} className="detail-field">
                    <label>{f.label}</label>
                    <span>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><span className="card-title">Description</span></div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{contract.description}</p>
              {contract.tags.length > 0 && (
                <div className="tags-list" style={{ marginTop: 14 }}>
                  {contract.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              )}
            </div>
          </div>
          <div className="detail-col">
            <div className="card">
              <div className="card-header"><span className="card-title">Financial & Dates</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Contract Value', value: contract.value !== undefined ? formatCurrency(contract.value, contract.currency) : '—' },
                  { label: 'Start Date', value: formatDate(contract.startDate) },
                  { label: 'Expiry Date', value: formatDate(contract.expiryDate) },
                  { label: 'Created', value: formatDateTime(contract.createdAt) },
                  { label: 'Last Updated', value: formatDateTime(contract.updatedAt) },
                  { label: 'Renewal Alert (days)', value: contract.renewalAlertDays ? `${contract.renewalAlertDays} days before expiry` : '—' },
                ].map(f => (
                  <div key={f.label} className="detail-field">
                    <label>{f.label}</label>
                    <span>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {tab === 'audit' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Audit Trail</span></div>
          <div className="timeline">
            {[...contract.auditTrail].reverse().map(entry => (
              <div key={entry.id} className="timeline-item">
                <div className="timeline-dot"><CheckCircle size={13} /></div>
                <div className="timeline-content">
                  <div className="timeline-action">{entry.action.charAt(0).toUpperCase() + entry.action.slice(1)} — {entry.userName}</div>
                  <div className="timeline-meta">{formatDateTime(entry.timestamp)}</div>
                  <div className="timeline-details">{entry.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {tab === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Add Comment</span></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <textarea className="form-control" placeholder="Add a comment or note..." value={comment} onChange={e => setComment(e.target.value)} style={{ flex: 1, minHeight: 72 }} />
              <button className="btn btn-primary" onClick={handleComment} style={{ alignSelf: 'flex-end' }}><Send size={14} /> Post</button>
            </div>
          </div>
          {contract.comments.length === 0 && <div className="empty-state"><FileText /><p>No comments yet</p></div>}
          <div className="comment-list">
            {contract.comments.map(c => (
              <div key={c.id} className="comment-item">
                <div className="comment-header">
                  <div className="comment-avatar">{c.userName.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                  <div>
                    <div className="comment-author">{c.userName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.userRole}</div>
                  </div>
                  <div className="comment-time">{timeAgo(c.createdAt)}</div>
                </div>
                <p className="comment-text">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Versions Tab */}
      {tab === 'versions' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Document Versions</span></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Version</th><th>Uploaded By</th><th>Date</th><th>Size</th><th>Notes</th></tr></thead>
              <tbody>
                {[...contract.versions].reverse().map(v => (
                  <tr key={v.version}>
                    <td><span className="badge status-review">v{v.version}</span></td>
                    <td>{v.uploadedBy}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDateTime(v.uploadedAt)}</td>
                    <td style={{ fontSize: 12 }}>{v.fileSize}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{v.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
