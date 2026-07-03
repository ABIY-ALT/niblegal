import { useState } from 'react';
import { advanceAdvisoryStatus, addAdvisoryComment, generateComment, USERS } from '../data/store';
import { ADVISORY_STATUS_LABELS, ADVISORY_STATUS_COLORS, ADVISORY_CATEGORY_LABELS, URGENCY_COLORS, formatDateTime, isSLABreached, slaHoursRemaining, timeAgo } from '../utils/formatters';
import { ArrowLeft, CheckCircle, Send, AlertTriangle, Clock } from 'lucide-react';
import type { AdvisoryRequest, User, AdvisoryStatus } from '../types';
import { advisoryRequests, updateAdvisoryRequest } from '../data/store';

interface Props { advisory: AdvisoryRequest; onBack: () => void; currentUser: User; }

const ADVISORY_TRANSITIONS: Record<AdvisoryStatus, { label: string; next: AdvisoryStatus; btnClass: string }[]> = {
  submitted: [{ label: 'Assign to Officer', next: 'assigned', btnClass: 'btn-primary' }],
  assigned: [{ label: 'Start Drafting', next: 'drafting', btnClass: 'btn-primary' }],
  drafting: [{ label: 'Submit for Review', next: 'under_review', btnClass: 'btn-primary' }],
  under_review: [{ label: 'Submit for Approval', next: 'pending_approval', btnClass: 'btn-primary' }, { label: 'Return to Drafting', next: 'drafting', btnClass: 'btn-warning' }],
  pending_approval: [{ label: 'Approve', next: 'approved', btnClass: 'btn-success' }, { label: 'Return for Revision', next: 'drafting', btnClass: 'btn-danger' }],
  approved: [{ label: 'Dispatch', next: 'dispatched', btnClass: 'btn-success' }],
  dispatched: [{ label: 'Close', next: 'closed', btnClass: 'btn-secondary' }],
  closed: [],
};

export default function AdvisoryDetail({ advisory: init, onBack, currentUser }: Props) {
  const [advisory, setAdvisory] = useState(init);
  const [tab, setTab] = useState<'details' | 'opinion' | 'audit' | 'comments'>('details');
  const [comment, setComment] = useState('');
  const [legalOpinion, setLegalOpinion] = useState(init.legalOpinion ?? '');
  const [assignTo, setAssignTo] = useState(init.assignedOfficer ?? '');

  const officers = USERS.filter(u => u.role === 'legal_officer');

  const refresh = () => {
    const updated = advisoryRequests.find(r => r.id === advisory.id);
    if (updated) setAdvisory({ ...updated });
  };

  const handleTransition = (next: AdvisoryStatus) => {
    if (next === 'assigned' && assignTo) {
      updateAdvisoryRequest(advisory.id, { assignedOfficer: assignTo });
    }
    advanceAdvisoryStatus(advisory.id, next, currentUser);
    refresh();
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    addAdvisoryComment(advisory.id, generateComment(currentUser.id, currentUser.name, currentUser.role, comment.trim()));
    setComment('');
    refresh();
  };

  const handleSaveOpinion = () => {
    updateAdvisoryRequest(advisory.id, { legalOpinion });
    refresh();
  };

  const transitions = ADVISORY_TRANSITIONS[advisory.status] ?? [];
  const breached = isSLABreached(advisory.slaDeadline, advisory.status);
  const hoursLeft = slaHoursRemaining(advisory.slaDeadline);
  const slaPercent = Math.max(0, Math.min(100, (hoursLeft / advisory.slaHours) * 100));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={15} /> Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--gold)' }}>{advisory.id}</span>
            <span className={`badge ${ADVISORY_STATUS_COLORS[advisory.status]}`}>{ADVISORY_STATUS_LABELS[advisory.status]}</span>
            <span className={`badge ${URGENCY_COLORS[advisory.urgency]}`}>{advisory.urgency.toUpperCase()}</span>
            {breached && <span className="badge urgency-critical">SLA BREACHED</span>}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{advisory.title}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{ADVISORY_CATEGORY_LABELS[advisory.category]} · {advisory.requestingDepartment}</p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {advisory.status === 'submitted' && (
            <select className="form-control" style={{ width: 180 }} value={assignTo} onChange={e => setAssignTo(e.target.value)}>
              <option value="">Select Officer...</option>
              {officers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
          )}
          {transitions.map(t => (
            <button key={t.next} className={`btn ${t.btnClass} btn-sm`} onClick={() => handleTransition(t.next)}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* SLA Bar */}
      <div className="card card-sm" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} /> SLA Status</span>
          <span style={{ color: breached ? 'var(--danger)' : hoursLeft < 12 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
            {breached ? 'BREACHED' : `${Math.round(hoursLeft)}h remaining`}
          </span>
        </div>
        <div className="sla-bar">
          <div className={`sla-fill ${breached ? 'sla-breach' : slaPercent < 30 ? 'sla-warn' : 'sla-ok'}`} style={{ width: `${breached ? 100 : slaPercent}%` }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Deadline: {formatDateTime(advisory.slaDeadline)} · SLA: {advisory.slaHours}h</div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(['details', 'opinion', 'audit', 'comments'] as const).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'opinion' ? 'Legal Opinion' : t === 'audit' ? 'Audit Trail' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'comments' && <span className="tab-count">{advisory.comments.length}</span>}
            {t === 'audit' && <span className="tab-count">{advisory.auditTrail.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'details' && (
        <div className="detail-grid">
          <div className="detail-col">
            <div className="card">
              <div className="card-header"><span className="card-title">Request Information</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Category', value: ADVISORY_CATEGORY_LABELS[advisory.category] },
                  { label: 'Requesting Department', value: advisory.requestingDepartment },
                  { label: 'Requested By', value: advisory.requestedBy },
                  { label: 'Assigned Officer', value: advisory.assignedOfficer ?? '—' },
                  { label: 'Reviewed By', value: advisory.reviewedBy ?? '—' },
                  { label: 'Approved By', value: advisory.approvedBy ?? '—' },
                  { label: 'Created', value: formatDateTime(advisory.createdAt) },
                  { label: 'Last Updated', value: formatDateTime(advisory.updatedAt) },
                ].map(f => <div key={f.label} className="detail-field"><label>{f.label}</label><span>{f.value}</span></div>)}
              </div>
            </div>
          </div>
          <div className="detail-col">
            <div className="card">
              <div className="card-header"><span className="card-title">Description</span></div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{advisory.description}</p>
              {advisory.tags.length > 0 && <div className="tags-list" style={{ marginTop: 14 }}>{advisory.tags.map(t => <span key={t} className="tag">{t}</span>)}</div>}
            </div>
            {advisory.attachments.length > 0 && (
              <div className="card">
                <div className="card-header"><span className="card-title">Attachments</span></div>
                {advisory.attachments.map(a => (
                  <div key={a} style={{ padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginBottom: 6, fontSize: 13 }}>📎 {a}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'opinion' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Legal Opinion / Advisory Output</span>
            <button className="btn btn-primary btn-sm" onClick={handleSaveOpinion}><Send size={13} /> Save Opinion</button>
          </div>
          <textarea className="form-control" style={{ minHeight: 320, fontSize: 14, lineHeight: 1.8 }} placeholder="Draft the legal opinion here..." value={legalOpinion} onChange={e => setLegalOpinion(e.target.value)} />
        </div>
      )}

      {tab === 'audit' && (
        <div className="card">
          <div className="card-header"><span className="card-title">Audit Trail</span></div>
          <div className="timeline">
            {[...advisory.auditTrail].reverse().map(entry => (
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

      {tab === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Add Comment</span></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <textarea className="form-control" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} style={{ flex: 1, minHeight: 72 }} />
              <button className="btn btn-primary" onClick={handleComment} style={{ alignSelf: 'flex-end' }}><Send size={14} /> Post</button>
            </div>
          </div>
          <div className="comment-list">
            {advisory.comments.map(c => (
              <div key={c.id} className="comment-item">
                <div className="comment-header">
                  <div className="comment-avatar">{c.userName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}</div>
                  <div><div className="comment-author">{c.userName}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.userRole}</div></div>
                  <div className="comment-time">{timeAgo(c.createdAt)}</div>
                </div>
                <p className="comment-text">{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
