'use client';

import { useState, use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { advisoryRequests, currentUser, advanceAdvisoryStatus, generateAuditEntry, updateAdvisoryRequest, USERS } from '@/data/store';
import { ADVISORY_STATUS_LABELS, ADVISORY_STATUS_COLORS, ADVISORY_CATEGORY_LABELS, URGENCY_COLORS, formatDateTime, formatDate, timeAgo } from '@/utils/formatters';
import { ArrowLeft, CheckCircle, Clock, FileText, Scale, Send, Shield, User, Paperclip, MessageSquare, AlertCircle, RefreshCw, PenTool, Edit3, CheckSquare, XCircle, Mail, Eye } from 'lucide-react';

export default function AdvisoryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = decodeURIComponent(resolvedParams.id);
  const reqInitial = advisoryRequests.find(r => r.id === id);

  if (!reqInitial) return notFound();

  const [req, setReq] = useState(reqInitial);
  const [activeTab, setActiveTab] = useState<'overview' | 'assignment' | 'opinion' | 'workflow' | 'audit'>('overview');
  
  // Assignment State
  const [assignee, setAssignee] = useState(req.assignedOfficer || '');
  const [isAssigning, setIsAssigning] = useState(false);

  // Opinion State
  const [opinionText, setOpinionText] = useState(req.legalOpinion || '');
  const [isSaving, setIsSaving] = useState(false);
  
  // Review State
  const [reviewComment, setReviewComment] = useState('');

  const isManager = currentUser.role === 'manager';
  const isOfficer = currentUser.role === 'legal_officer';
  const isAssignedToMe = req.assignedOfficer === currentUser.name;

  const handleAssign = async () => {
    setIsAssigning(true);
    await new Promise(r => setTimeout(r, 600));
    updateAdvisoryRequest(req.id, { assignedOfficer: assignee });
    if (req.status === 'submitted') {
      advanceAdvisoryStatus(req.id, 'assigned', currentUser);
    }
    setReq(advisoryRequests.find(r => r.id === id)!);
    setIsAssigning(false);
  };

  const handleSaveOpinion = async (submitForReview = false) => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    updateAdvisoryRequest(req.id, { legalOpinion: opinionText });
    if (submitForReview) {
      advanceAdvisoryStatus(req.id, 'pending_approval', currentUser);
    } else if (req.status === 'assigned' || req.status === 'under_review') {
      advanceAdvisoryStatus(req.id, 'drafting', currentUser);
    }
    setReq(advisoryRequests.find(r => r.id === id)!);
    setIsSaving(false);
  };

  const handleReview = async (action: 'approve' | 'return') => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    if (action === 'approve') {
      advanceAdvisoryStatus(req.id, 'approved', currentUser);
    } else {
      advanceAdvisoryStatus(req.id, 'under_review', currentUser);
    }
    // In a real app we'd add the reviewComment to comments array
    setReq(advisoryRequests.find(r => r.id === id)!);
    setIsSaving(false);
    setReviewComment('');
  };

  const handleDispatch = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    advanceAdvisoryStatus(req.id, 'dispatched', currentUser);
    setReq(advisoryRequests.find(r => r.id === id)!);
    setIsSaving(false);
  };

  const isBreached = new Date(req.slaDeadline) < new Date() && !['dispatched', 'closed'].includes(req.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div>
        <Link href="/advisory" className="btn btn-ghost btn-sm" style={{ paddingLeft: 0, marginBottom: 12 }}>
          <ArrowLeft size={16} /> Back to Requests
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{req.title}</h1>
              <span className={`badge ${(ADVISORY_STATUS_COLORS as any)[req.status]}`}>{(ADVISORY_STATUS_LABELS as any)[req.status]}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13, fontFamily: 'monospace' }}>{req.id} • {(ADVISORY_CATEGORY_LABELS as any)[req.category]}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {req.status === 'pending_approval' && (
              <Link href={`/advisory/review/${req.id}`} className="btn btn-primary btn-sm">
                <Eye size={14} style={{ marginRight: 6 }} /> Review
              </Link>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SLA Deadline</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: isBreached ? 'var(--danger)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} /> {formatDateTime(req.slaDeadline)}
              </div>
              {isBreached && <div style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600, marginTop: 4 }}>SLA BREACHED</div>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="tabs-bar">
        {[
          { id: 'overview', label: 'Overview', icon: <FileText size={15} /> },
          { id: 'assignment', label: 'Assignment', icon: <User size={15} /> },
          { id: 'opinion', label: 'Legal Opinion', icon: <Scale size={15} /> },
          { id: 'workflow', label: 'Review & Dispatch', icon: <CheckSquare size={15} /> },
          { id: 'audit', label: 'Audit Trail', icon: <Shield size={15} /> },
        ].map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id as any)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        
        {/* ── Main Content Area ─────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {activeTab === 'overview' && (
            <div className="card">
              <div className="card-header"><span className="card-title">Request Details</span></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Requesting Department</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{req.requestingDepartment} (by {req.requestedBy})</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Urgency</div>
                  <span className={`badge ${(URGENCY_COLORS as any)[req.urgency]}`}>{req.urgency}</span>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Description</div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                    {req.description}
                  </p>
                </div>
              </div>
              <div className="card-header" style={{ borderTop: '1px solid var(--border-light)', paddingTop: 20 }}><span className="card-title">Attachments ({req.attachments.length})</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {req.attachments.map((file, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <Paperclip size={16} color="var(--accent)" />
                    <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{file}</span>
                    <button className="btn btn-ghost btn-sm">Download</button>
                  </div>
                ))}
                {req.attachments.length === 0 && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No attachments provided.</span>}
              </div>
            </div>
          )}

          {activeTab === 'assignment' && (
            <div className="card">
              <div className="card-header"><span className="card-title">Task Assignment</span></div>
              
              <div style={{ padding: 16, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Current Assignee</div>
                <div style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={18} color={req.assignedOfficer ? 'var(--accent)' : 'var(--text-muted)'} />
                  {req.assignedOfficer || 'Unassigned'}
                </div>
              </div>

              {isManager ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Assign / Reassign Officer</label>
                    <select className="form-control" value={assignee} onChange={e => setAssignee(e.target.value)}>
                      <option value="">-- Select Legal Officer --</option>
                      {USERS.filter(u => u.role === 'legal_officer').map(u => (
                        <option key={u.id} value={u.name}>{u.name} ({u.department})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-primary" onClick={handleAssign} disabled={isAssigning || !assignee || assignee === req.assignedOfficer}>
                      {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                    </button>
                    <button className="btn btn-secondary"><AlertCircle size={14}/> Escalate Request</button>
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning" style={{ fontSize: 13 }}>
                  Only managers can reassign or escalate advisory requests.
                </div>
              )}
            </div>
          )}

          {activeTab === 'opinion' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 600 }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title">Legal Opinion Editor</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost btn-sm" title="Template Library"><FileText size={14}/> Templates</button>
                  <button className="btn btn-ghost btn-sm" title="Legal References"><Scale size={14}/> References</button>
                </div>
              </div>
              
              {!isAssignedToMe && !isManager && req.status !== 'approved' && req.status !== 'dispatched' ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  You must be assigned to this request to draft the opinion.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 16 }}>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Fake rich text toolbar */}
                    <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, borderTopLeftRadius: 'var(--radius-sm)', borderTopRightRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontWeight: 700, cursor: 'pointer' }}>B</span>
                      <span style={{ fontStyle: 'italic', cursor: 'pointer' }}>I</span>
                      <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>U</span>
                      <span style={{ color: 'var(--border)' }}>|</span>
                      <span style={{ cursor: 'pointer' }}><PenTool size={14}/></span>
                    </div>
                    <textarea 
                      className="form-control"
                      style={{ flex: 1, border: 'none', borderRadius: 0, resize: 'none', padding: 20, fontSize: 14, lineHeight: 1.7 }}
                      placeholder="Draft your legal opinion here..."
                      value={opinionText}
                      onChange={e => setOpinionText(e.target.value)}
                      readOnly={req.status === 'approved' || req.status === 'dispatched' || req.status === 'closed'}
                    />
                  </div>
                  
                  {!(req.status === 'approved' || req.status === 'dispatched' || req.status === 'closed') && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      <button className="btn btn-secondary" onClick={() => handleSaveOpinion(false)} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Draft'}
                      </button>
                      <button className="btn btn-primary" onClick={() => handleSaveOpinion(true)} disabled={isSaving || !opinionText.trim()}>
                        <CheckSquare size={16}/> Submit for Review
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'workflow' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Manager Review Section */}
              <div className="card">
                <div className="card-header"><span className="card-title">Manager Review</span></div>
                {req.status === 'pending_approval' ? (
                  isManager ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <p style={{ fontSize: 13, margin: 0 }}>The draft opinion has been submitted by {req.assignedOfficer} and is awaiting your review.</p>
                      <textarea 
                        className="form-control"
                        rows={3}
                        placeholder="Add review comments (optional if approving, required if returning)..."
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn btn-primary" onClick={() => handleReview('approve')} disabled={isSaving} style={{ background: 'var(--success)', borderColor: 'var(--success)' }}>
                          <CheckCircle size={16} /> Approve Opinion
                        </button>
                        <button className="btn btn-secondary" onClick={() => handleReview('return')} disabled={isSaving || !reviewComment.trim()} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                          <XCircle size={16} /> Return for Revision
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-warning">Awaiting manager approval. You cannot make changes at this stage.</div>
                  )
                ) : req.status === 'approved' || req.status === 'dispatched' || req.status === 'closed' ? (
                  <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} /> Opinion was approved by {req.approvedBy || 'Manager'}.
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>The opinion is currently in drafting phase and not yet ready for review.</div>
                )}
              </div>

              {/* Dispatch Section */}
              <div className="card">
                <div className="card-header"><span className="card-title">Dispatch & Close</span></div>
                {req.status === 'approved' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <p style={{ fontSize: 13, margin: 0 }}>The opinion is approved and ready to be sent to the requesting department ({req.requestingDepartment}).</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                      <input type="checkbox" id="notify" defaultChecked style={{ accentColor: 'var(--accent)' }}/>
                      <label htmlFor="notify" style={{ fontSize: 13, cursor: 'pointer' }}>Send automatic email notification to {req.requestedBy}</label>
                    </div>
                    <button className="btn btn-primary" onClick={handleDispatch} disabled={isSaving} style={{ width: 'fit-content' }}>
                      <Send size={16}/> Dispatch & Close Request
                    </button>
                  </div>
                ) : req.status === 'dispatched' || req.status === 'closed' ? (
                  <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={16} /> Opinion was dispatched successfully. The request is closed.
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Dispatch becomes available only after the opinion is approved by a manager.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="card">
              <div className="card-header"><span className="card-title">Audit Trail</span></div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[...req.auditTrail].reverse().map((entry, i) => (
                  <div key={entry.id} style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: i < req.auditTrail.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Shield size={14} color="var(--text-muted)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{entry.details}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <User size={11} /> {entry.userName} • <Clock size={11}/> {formatDateTime(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ background: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--border-light)', paddingBottom: 8 }}>Status Tracker</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Submitted', key: 'submitted' },
                { label: 'Assigned', key: 'assigned' },
                { label: 'Drafting', key: 'drafting' },
                { label: 'Pending Approval', key: 'pending_approval' },
                { label: 'Approved', key: 'approved' },
                { label: 'Dispatched', key: 'dispatched' },
              ].map((step, i) => {
                const stepOrder = ['submitted', 'assigned', 'drafting', 'under_review', 'pending_approval', 'approved', 'dispatched', 'closed'];
                const currentIdx = stepOrder.indexOf(req.status);
                const stepIdx = stepOrder.indexOf(step.key);
                
                let statusColor = 'var(--text-muted)';
                let isComplete = false;
                
                if (currentIdx >= stepIdx) {
                  statusColor = 'var(--accent)';
                  isComplete = true;
                }
                
                return (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${statusColor}`, background: isComplete ? statusColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      {isComplete && <CheckCircle size={14} />}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: isComplete ? 600 : 400, color: isComplete ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
