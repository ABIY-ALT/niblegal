'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  RotateCcw,
  MessageSquare,
  FileText,
  Clock,
  Download,
  Send
} from 'lucide-react';
import {
  advisoryRequests as storeAdvisoryRequests,
  currentUser,
  addAdvisoryComment,
  advanceAdvisoryStatus,
  updateAdvisoryRequest
} from '@/data/store';
import {
  ADVISORY_STATUS_LABELS,
  ADVISORY_STATUS_COLORS,
  ADVISORY_CATEGORY_LABELS,
  URGENCY_COLORS,
  formatDate,
  formatDateTime,
  timeAgo
} from '@/utils/formatters';
import type { AdvisoryRequest, Comment } from '@/types';
import { generateComment } from '@/data/store';

export default function AdvisoryReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const initialRequest = storeAdvisoryRequests.find((r: AdvisoryRequest) => r.id === id);

  if (!initialRequest) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <h2>Legal request not found</h2>
        <Link href="/advisory" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Legal Requests
        </Link>
      </div>
    );
  }

  const [request, setRequest] = useState(initialRequest);
  const [selectedTab, setSelectedTab] = useState<'details' | 'opinion' | 'comments'>('details');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = () => {
    const updated = storeAdvisoryRequests.find((r: AdvisoryRequest) => r.id === id);
    if (updated) setRequest({ ...updated });
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    addAdvisoryComment(id, generateComment(currentUser.id, currentUser.name, currentUser.role, comment.trim()));
    setComment('');
    refresh();
  };

  const handleAction = async (action: string) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    
    let nextStatus;
    switch (action) {
      case 'approve':
        nextStatus = 'approved';
        break;
      case 'return':
        nextStatus = 'drafting';
        break;
      case 'reject':
        nextStatus = 'drafting';
        break;
    }
    if (nextStatus) {
      advanceAdvisoryStatus(id, nextStatus, currentUser);
    }
    
    alert(`${action} successful!`);
    setLoading(false);
    router.push('/advisory');
  };

  const isBreached = new Date(request.slaDeadline) < new Date() && !['dispatched', 'closed'].includes(request.status);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <Link href="/advisory" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} /> Back
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--gold)' }}>{request.id}</span>
            <span className={`badge ${ADVISORY_STATUS_COLORS[request.status]}`}>{ADVISORY_STATUS_LABELS[request.status]}</span>
            <span className={`badge ${URGENCY_COLORS[request.urgency]}`}>{request.urgency}</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{request.title}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {request.requestingDepartment} · {ADVISORY_CATEGORY_LABELS[request.category]}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => handleAction('return')}
            disabled={loading}
          >
            <RotateCcw size={16} /> Return
          </button>
          <button 
            className="btn btn-danger btn-sm" 
            onClick={() => handleAction('reject')}
            disabled={loading}
          >
            <XCircle size={16} /> Reject
          </button>
          <button 
            className="btn btn-success btn-sm" 
            onClick={() => handleAction('approve')}
            disabled={loading}
          >
            <CheckCircle size={16} /> {loading ? 'Processing...' : 'Approve'}
          </button>
        </div>
      </div>

      {/* SLA Alert */}
      <div className={`alert ${isBreached ? 'alert-danger' : 'alert-warning'}`} style={{ marginBottom: 20 }}>
        <Clock size={16} />
        <span>SLA Deadline: <strong>{formatDateTime(request.slaDeadline)}</strong> {isBreached ? '(BREACHED)' : ''}</span>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        {[
          { id: 'details', label: 'Request Details' },
          { id: 'opinion', label: 'Legal Opinion' },
          { id: 'comments', label: `Review Comments (${request.comments.length})` }
        ].map(t => (
          <button key={t.id} className={`tab-btn ${selectedTab === t.id ? 'active' : ''}`} onClick={() => setSelectedTab(t.id as any)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {selectedTab === 'details' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Request Details</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {request.attachments.length > 0 && (
                <button className="btn btn-ghost btn-sm">
                  <Download size={14} /> Download Attachments
                </button>
              )}
            </div>
          </div>
          <div className="detail-grid" style={{ marginBottom: 24 }}>
            <div className="detail-col">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Category', value: ADVISORY_CATEGORY_LABELS[request.category] },
                  { label: 'Requesting Department', value: request.requestingDepartment },
                  { label: 'Requested By', value: request.requestedBy },
                  { label: 'Assigned Officer', value: request.assignedOfficer ?? '—' },
                  { label: 'Created', value: formatDateTime(request.createdAt) },
                ].map(f => (
                  <div key={f.label} className="detail-field">
                    <label>{f.label}</label>
                    <span>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="detail-col">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'SLA Deadline', value: formatDateTime(request.slaDeadline) },
                  { label: 'Last Updated', value: formatDateTime(request.updatedAt) },
                  { label: 'Current Status', value: <span className={`badge ${ADVISORY_STATUS_COLORS[request.status]}`}>{ADVISORY_STATUS_LABELS[request.status]}</span> }
                ].map(f => (
                  <div key={f.label} className="detail-field">
                    <label>{f.label}</label>
                    <span>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card" style={{ borderLeft: '1px solid var(--border-light)' }}>
            <div className="card-header">
              <span className="card-title">Description</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{request.description}</p>
            {request.tags.length > 0 && (
              <div className="tags-list" style={{ marginTop: 14 }}>
                {request.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
          </div>
          {request.attachments.length > 0 && (
            <div className="card" style={{ marginTop: 20, borderLeft: '1px solid var(--border-light)' }}>
              <div className="card-header">
                <span className="card-title">Attachments</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {request.attachments.map((file, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    <FileText size={16} color="var(--accent)" />
                    <span style={{ flex: 1, fontSize: 13 }}>{file}</span>
                    <button className="btn btn-ghost btn-sm"><Download size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legal Opinion Tab */}
      {selectedTab === 'opinion' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Legal Opinion</span>
          </div>
          <div style={{ padding: 20, minHeight: 300, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
            {request.legalOpinion ? (
              <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                {request.legalOpinion}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                <FileText size={48} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p>No legal opinion provided yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {selectedTab === 'comments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title">Add Review Comment</span></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <textarea 
                className="form-control" 
                placeholder="Add a comment or note about this legal request..." 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                style={{ flex: 1, minHeight: 100 }}
              />
              <button 
                className="btn btn-primary" 
                onClick={handleComment} 
                disabled={!comment.trim()}
                style={{ alignSelf: 'flex-end' }}
              >
                <Send size={14} /> Post
              </button>
            </div>
          </div>
          {request.comments.length === 0 && (
            <div className="empty-state">
              <MessageSquare size={48} color="var(--text-muted)" />
              <p>No review comments yet</p>
            </div>
          )}
          <div className="comment-list">
            {request.comments.map((c: Comment) => (
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
    </div>
  );
}
