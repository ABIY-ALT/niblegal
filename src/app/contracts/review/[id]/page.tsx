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
  ChevronDown,
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
import type { Contract, Comment, ContractVersion } from '@/types';
import { generateComment } from '@/data/store';

export default function ContractReviewPage() {
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
  const [selectedTab, setSelectedTab] = useState<'details' | 'compare' | 'comments'>('details');
  const [comment, setComment] = useState('');
  const [oldVersion, setOldVersion] = useState<number>(1);
  const [newVersion, setNewVersion] = useState<number>(initialContract.versions.length);
  const [loading, setLoading] = useState(false);

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
        nextStatus = 'pending_approval';
        break;
      case 'request-modification':
      case 'return-to-maker':
        nextStatus = 'draft';
        break;
      case 'reject':
        nextStatus = 'draft';
        break;
    }
    if (nextStatus) {
      advanceContractStatus(id, nextStatus, currentUser);
    }
    
    alert(`${action} successful!`);
    setLoading(false);
    router.push('/contracts');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
            onClick={() => handleAction('return-to-maker')}
            disabled={loading}
          >
            <RotateCcw size={16} /> Return to Maker
          </button>
          <button 
            className="btn btn-warning btn-sm" 
            onClick={() => handleAction('request-modification')}
            disabled={loading}
          >
            <MessageSquare size={16} /> Request Modification
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
        {[
          { id: 'details', label: 'Contract Details' },
          { id: 'compare', label: `Compare Versions (${contract.versions.length})` },
          { id: 'comments', label: `Review Comments (${contract.comments.length})` }
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
            <span className="card-title">Contract Details</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm">
                <Download size={14} /> Download Document
              </button>
            </div>
          </div>
          <div className="detail-grid" style={{ marginBottom: 24 }}>
            <div className="detail-col">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Category', value: CONTRACT_CATEGORY_LABELS[contract.category] },
                  { label: 'Counterparty', value: contract.counterparty },
                  { label: 'Requesting Department', value: contract.requestingDepartment },
                  { label: 'Requested By', value: contract.requestedBy },
                  { label: 'Assigned Officer', value: contract.assignedOfficer ?? '—' },
                  { label: 'Created', value: formatDateTime(contract.createdAt) },
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
                  { label: 'Last Updated', value: formatDateTime(contract.updatedAt) },
                  { label: 'Current Status', value: <span className={`badge ${CONTRACT_STATUS_COLORS[contract.status]}`}>{CONTRACT_STATUS_LABELS[contract.status]}</span> }
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
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{contract.description}</p>
            {contract.tags.length > 0 && (
              <div className="tags-list" style={{ marginTop: 14 }}>
                {contract.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Compare Versions Tab */}
      {selectedTab === 'compare' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Compare Versions</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Old:</label>
                <select
                  style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}
                  value={oldVersion}
                  onChange={(e) => setOldVersion(parseInt(e.target.value))}
                >
                  {contract.versions.map(v => (
                    <option key={v.version} value={v.version}>v{v.version} - {formatDateTime(v.uploadedAt)}</option>
                  ))}
                </select>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 600 }}>→</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>New:</label>
                <select
                  style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 13 }}
                  value={newVersion}
                  onChange={(e) => setNewVersion(parseInt(e.target.value))}
                >
                  {contract.versions.map(v => (
                    <option key={v.version} value={v.version}>v{v.version} - {formatDateTime(v.uploadedAt)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div style={{ borderRight: '1px solid var(--border-light)' }}>
              <div style={{ padding: '8px 0', marginBottom: 12, borderBottom: '1px solid var(--border-light)', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>v{oldVersion} (Old)</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>- {contract.versions.find(v => v.version === oldVersion)?.uploadedBy} • {formatDateTime(contract.versions.find(v => v.version === oldVersion)!.uploadedAt)}</span>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: 20, borderRadius: 'var(--radius-sm)', minHeight: 300 }}>
                <div style={{ color: 'var(--text-muted)' }}>
                  <div style={{ textDecoration: 'line-through', color: 'var(--danger)', marginBottom: 8 }}>• Removed clause: Payment terms</div>
                  <div style={{ marginBottom: 4 }}><strong>Service Agreement v{oldVersion}</strong></div>
                  <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    This Agreement is made and entered into on {contract.startDate ? formatDate(contract.startDate) : 'DATE'} by and between {contract.counterparty} and NIB Bank.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div style={{ padding: '8px 0', marginBottom: 12, borderBottom: '1px solid var(--border-light)', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>v{newVersion} (New)</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>- {contract.versions.find(v => v.version === newVersion)?.uploadedBy} • {formatDateTime(contract.versions.find(v => v.version === newVersion)!.uploadedAt)}</span>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: 20, borderRadius: 'var(--radius-sm)', minHeight: 300 }}>
                <div style={{ color: 'var(--text-muted)' }}>
                  <div style={{ background: 'var(--success)/10', color: 'var(--success)', marginBottom: 8, padding: '4px 8px', borderRadius: 'var(--radius-xs)', display: 'inline-block' }}>+ Added clause: Payment terms</div>
                  <div style={{ marginBottom: 4 }}><strong>Service Agreement v{newVersion}</strong></div>
                  <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    This Agreement is made and entered into on {contract.startDate ? formatDate(contract.startDate) : 'DATE'} by and between {contract.counterparty} and NIB Bank.
                  </p>
                  <div style={{ marginTop: 12, background: 'var(--success)/10', borderLeft: '3px solid var(--success)', padding: 8, borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                    <strong>Payment Terms:</strong> 30-day payment terms with 5% late fee.
                  </div>
                </div>
              </div>
            </div>
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
                placeholder="Add a comment or note about this contract..." 
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
          {contract.comments.length === 0 && (
            <div className="empty-state">
              <MessageSquare size={48} color="var(--text-muted)" />
              <p>No review comments yet</p>
            </div>
          )}
          <div className="comment-list">
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
        </div>
      )}
    </div>
  );
}
