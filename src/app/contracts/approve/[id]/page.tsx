'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Users,
  FileCheck,
  Clock,
  Download,
  PenTool,
  History,
  Send
} from 'lucide-react';
import {
  contracts as storeContracts,
  currentUser,
  USERS,
  addContractComment,
  advanceContractStatus
} from '@/data/store';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_CATEGORY_LABELS,
  formatDate,
  formatDateTime,
  timeAgo
} from '@/utils/formatters';
import type { Contract, Comment, AuditEntry } from '@/types';
import { generateComment } from '@/data/store';

export default function ContractApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const initialContract = storeContracts.find((c: Contract) => c.id === id);

  if (!initialContract) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <h2>Contract not found</h2>
        <Link href="/contracts" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Contracts
        </Link>
      </div>
    );
  }

  const [contract, setContract] = useState(initialContract);
  const [loading, setLoading] = useState(false);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [selectedDelegate, setSelectedDelegate] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTab, setSelectedTab] = useState<'details' | 'history'>('details');

  const refresh = () => {
    const updated = storeContracts.find((c: Contract) => c.id === id);
    if (updated) setContract({ ...updated });
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    addContractComment(id, generateComment(currentUser.id, currentUser.name, currentUser.role, comment.trim()));
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
      case 'reject':
        nextStatus = 'under_review';
        break;
    }
    if (nextStatus) {
      advanceContractStatus(id, nextStatus, currentUser);
    }
    
    alert(`${action} successful!`);
    setLoading(false);
    router.push('/contracts');
  };

  const handleDelegate = () => {
    alert(`Contract delegated to ${selectedDelegate}`);
    setShowDelegateModal(false);
    setSelectedDelegate('');
  };

  const approvalHistory = [
    {
      id: 1,
      action: 'Submitted for Approval',
      user: 'Selamawit Wolde',
      role: 'Requesting Organ',
      timestamp: subDays(new Date(), 3).toISOString(),
      details: 'Contract submitted for legal approval'
    },
    {
      id: 2,
      action: 'Reviewed',
      user: 'Yonas Bekele',
      role: 'Legal Officer',
      timestamp: subDays(new Date(), 2).toISOString(),
      details: 'Contract reviewed and approved'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <Link href="/contracts" className="btn btn-ghost btn-sm">
          <ArrowLeft size={15} /> Back
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--gold)' }}>{contract.id}</span>
            <span className={`badge ${CONTRACT_STATUS_COLORS[contract.status]}`}>{CONTRACT_STATUS_LABELS[contract.status]}</span>
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{contract.title}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{contract.counterparty} · {CONTRACT_CATEGORY_LABELS[contract.category]}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => setShowDelegateModal(true)}
          >
            <Users size={16} /> Delegate
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
      {contract.slaDeadline && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <Clock size={16} />
          <span>SLA Deadline: <strong>{formatDateTime(contract.slaDeadline)}</strong></span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab-btn ${selectedTab === 'details' ? 'active' : ''}`} onClick={() => setSelectedTab('details')}>
          Contract Details
        </button>
        <button className={`tab-btn ${selectedTab === 'history' ? 'active' : ''}`} onClick={() => setSelectedTab('history')}>
          Approval History
        </button>
      </div>

      {/* Details Tab */}
      {selectedTab === 'details' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <span className="card-title">Contract Details</span>
                <button className="btn btn-ghost btn-sm">
                  <Download size={14} /> Download Document
                </button>
              </div>
              <div className="detail-grid">
                <div className="detail-col">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[
                      { label: 'Category', value: CONTRACT_CATEGORY_LABELS[contract.category] },
                      { label: 'Counterparty', value: contract.counterparty },
                      { label: 'Requesting Department', value: contract.requestingDepartment },
                      { label: 'Requested By', value: contract.requestedBy },
                      { label: 'Assigned Officer', value: contract.assignedOfficer ?? '—' },
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
                      { label: 'Start Date', value: contract.startDate ? formatDate(contract.startDate) : '—' },
                      { label: 'Expiry Date', value: contract.expiryDate ? formatDate(contract.expiryDate) : '—' },
                      { label: 'Created', value: formatDateTime(contract.createdAt) },
                      { label: 'Last Updated', value: formatDateTime(contract.updatedAt) },
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

            <div className="card">
              <div className="card-header">
                <span className="card-title">Description</span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{contract.description}</p>
              {contract.tags.length > 0 && (
                <div className="tags-list" style={{ marginTop: 14 }}>
                  {contract.tags.map(t => <span key={t} className="tag">{t}</span>)}
                </div>
              )}
            </div>

            <div className="card" style={{ marginTop: 24 }}>
              <div className="card-header">
                <span className="card-title">Add Comment</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <textarea 
                  className="form-control" 
                  placeholder="Add a comment about this contract..." 
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
              {contract.comments.length > 0 && (
                <div className="comment-list" style={{ marginTop: 24 }}>
                  {contract.comments.map((c: Comment) => (
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
              )}
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <span className="card-title"><FileCheck size={14} /> Digital Signature Ready</span>
              </div>
              <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-light)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PenTool size={20} color="white" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Contract Ready for Signature</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>All parties have been notified</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Dr. Tadesse Girma (Manager)', 'Yonas Bekele (Legal Officer)', 'Third Party'].map((party, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: idx < 2 ? 'var(--success)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx < 2 ? 'white' : 'var(--text-muted)' }}>
                      {idx < 2 ? <CheckCircle size={16} /> : <Clock size={16} />}
                    </div>
                    <span style={{ fontSize: 13, color: idx < 2 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {party}
                    </span>
                    {idx < 2 && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>Signed</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {selectedTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title"><History size={14} /> Approval History</span>
          </div>
          <div className="timeline">
            {[...approvalHistory, ...contract.auditTrail.map((entry: AuditEntry) => ({
              id: entry.id,
              action: entry.action.charAt(0).toUpperCase() + entry.action.slice(1),
              user: entry.userName,
              role: 'User',
              timestamp: entry.timestamp,
              details: entry.details
            }))].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((entry) => (
              <div key={entry.id} className="timeline-item">
                <div className="timeline-dot"><CheckCircle size={13} /></div>
                <div className="timeline-content">
                  <div className="timeline-action">{entry.action} — {entry.user}</div>
                  <div className="timeline-meta">{formatDateTime(entry.timestamp)}</div>
                  <div className="timeline-details">{entry.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delegate Modal */}
      {showDelegateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 480, maxWidth: '90%' }}>
            <div className="card-header">
              <span className="card-title">Delegate Approval</span>
              <button onClick={() => setShowDelegateModal(false)} className="btn btn-ghost btn-sm">
                <XCircle size={14} />
              </button>
            </div>
            <div style={{ padding: '24px 0' }}>
              <div className="form-group">
                <label className="form-label">Select Delegate</label>
                <select
                  className="form-control"
                  value={selectedDelegate}
                  onChange={(e) => setSelectedDelegate(e.target.value)}
                >
                  <option value="">Select a team member</option>
                  {USERS.filter(u => u.role === 'manager' || u.role === 'legal_officer').map(u => (
                    <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Comment (Optional)</label>
                <textarea className="form-control" placeholder="Add a reason for delegation..." rows={3} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
              <button className="btn btn-ghost" onClick={() => setShowDelegateModal(false)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                disabled={!selectedDelegate}
                onClick={handleDelegate}
              >
                Delegate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function
function subDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - days);
  return newDate;
}
