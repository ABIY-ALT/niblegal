'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, FileText, Activity, History, Users, Paperclip, File as FileIcon,
  Upload, Send, CheckCircle, XCircle, UserPlus, Gavel, Truck, ShieldCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type Officer = { id: string; firstName: string; lastName: string; role: { name: string } };

const STATUS_LABEL = (s: string) => s.replace(/_/g, ' ');

export default function ContractDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? '';
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const role = me?.role;

  const [tab, setTab] = useState<'overview' | 'workflow' | 'versions' | 'comments' | 'approvals' | 'audit'>('overview');
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [modal, setModal] = useState<null | 'assign' | 'review' | 'approve'>(null);

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${id}`);
      if (!res.ok) throw new Error('Failed to fetch contract');
      return (await res.json()).data;
    },
    enabled: !!id,
  });

  const { data: officers } = useQuery<Officer[]>({
    queryKey: ['contract-officers'],
    queryFn: async () => (await (await fetch('/api/advisory/officers')).json()).data,
    enabled: modal === 'assign',
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['contract', id] });

  async function runAction(path: string, body?: unknown, opts?: { form?: FormData }) {
    setBusy(true);
    setBanner(null);
    try {
      const res = await fetch(`/api/contracts/${id}/${path}`, {
        method: 'POST',
        ...(opts?.form
          ? { body: opts.form }
          : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Action failed');
      setBanner({ kind: 'ok', msg: 'Done.' });
      setModal(null);
      refresh();
    } catch (e) {
      setBanner({ kind: 'err', msg: e instanceof Error ? e.message : 'Action failed' });
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="text-center py-20"><div className="spinner-sm border-accent mx-auto" /></div>;
  if (error || !contract) return <div className="text-center py-20 text-danger font-semibold">Contract not found</div>;

  const status: string = contract.status;
  const isStaff = role === 'legal_officer' || role === 'manager' || role === 'admin_assistant';
  const canSubmit = status === 'DRAFT' && (isStaff || contract.requester?.id === me?.id);
  const canAssign = status !== 'EXPIRED' && (role === 'manager' || role === 'admin_assistant');
  const canReview = status === 'UNDER_REVIEW' && (role === 'legal_officer' || role === 'manager');
  const canApprove = status === 'PENDING_APPROVAL' && role === 'manager';
  const canExecute = status === 'APPROVED' && (role === 'legal_officer' || role === 'manager');
  const canDispatch = (status === 'EXECUTED' || status === 'ACTIVE') && isStaff && !contract.dispatchedAt;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/contracts/list" className="btn btn-ghost btn-sm px-2"><ArrowLeft size={16} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-[var(--gold)]">{contract.contractNumber}</span>
            <span className={`badge status-${status.toLowerCase().replace(/_/g, '-')}`}>{STATUS_LABEL(status)}</span>
            {contract.slaBreached && <span className="badge bg-[var(--danger)] text-white text-xs">SLA breached</span>}
          </div>
          <h2 className="text-xl font-bold m-0">{contract.title}</h2>
          <p className="text-sm text-muted mt-1">{contract.counterparty} · {STATUS_LABEL(contract.category)}</p>
        </div>
      </div>

      {/* Action bar */}
      {(canSubmit || canAssign || canReview || canApprove || canExecute || canDispatch) && (
        <div className="card flex flex-wrap items-center gap-2 py-3">
          <span className="text-sm text-muted mr-1 flex items-center gap-1"><Activity size={14} /> Workflow actions:</span>
          {canSubmit && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => runAction('submit')}><Send size={14} /> Submit for review</button>}
          {canAssign && <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => setModal('assign')}><UserPlus size={14} /> Assign officer</button>}
          {canReview && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => setModal('review')}><CheckCircle size={14} /> Record review</button>}
          {canApprove && <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => setModal('approve')}><Gavel size={14} /> Approve / Reject</button>}
          {canExecute && <button className="btn btn-success btn-sm" disabled={busy} onClick={() => runAction('execute')}><ShieldCheck size={14} /> Mark executed</button>}
          {canDispatch && <button className="btn btn-success btn-sm" disabled={busy} onClick={() => runAction('dispatch')}><Truck size={14} /> Dispatch</button>}
        </div>
      )}

      {banner && (
        <div className={`alert ${banner.kind === 'ok' ? 'alert-success' : 'alert-danger'}`}>{banner.msg}</div>
      )}

      {/* Tabs */}
      <div className="tabs border-b border-border flex gap-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: <FileText size={14} /> },
          { id: 'workflow', label: 'Workflow', icon: <Activity size={14} /> },
          { id: 'versions', label: 'Versions', count: contract.versions?.length, icon: <History size={14} /> },
          { id: 'comments', label: 'Comments', count: contract.comments?.length, icon: <Users size={14} /> },
          { id: 'approvals', label: 'Approvals', count: contract.approvals?.length, icon: <Gavel size={14} /> },
          { id: 'audit', label: 'Audit Trail', count: contract.history?.length, icon: <FileIcon size={14} /> },
        ].map((t) => (
          <button
            key={t.id}
            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${tab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'}`}
            onClick={() => setTab(t.id as typeof tab)}
          >
            {t.icon} {t.label} {t.count !== undefined && <span className="bg-[var(--bg-input)] px-2 py-0.5 rounded-full text-xs">{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card flex flex-col gap-4">
            <h3 className="font-semibold border-b border-border pb-2">Contract Information</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted">Category</div><div>{STATUS_LABEL(contract.category)}</div>
              <div className="text-muted">Vendor</div><div>{contract.counterparty}</div>
              <div className="text-muted">Department</div><div>{contract.requestingDepartment?.name || contract.requester?.department?.name || '—'}</div>
              <div className="text-muted">Requested By</div><div>{contract.requester?.firstName} {contract.requester?.lastName}</div>
              <div className="text-muted">Assigned Officer</div><div>{contract.assignee ? `${contract.assignee.firstName} ${contract.assignee.lastName}` : '—'}</div>
            </div>
            <h3 className="font-semibold border-b border-border pb-2 mt-4">Description</h3>
            <p className="text-sm text-muted">{contract.description || 'No description provided.'}</p>
          </div>
          <div className="card flex flex-col gap-4">
            <h3 className="font-semibold border-b border-border pb-2">Financial & Dates</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted">Value</div><div>{contract.value ? `${contract.value} ${contract.currency}` : '—'}</div>
              <div className="text-muted">Start Date</div><div>{contract.startDate ? format(new Date(contract.startDate), 'MMM d, yyyy') : '—'}</div>
              <div className="text-muted">Expiry Date</div><div>{contract.expiryDate ? format(new Date(contract.expiryDate), 'MMM d, yyyy') : '—'}</div>
              <div className="text-muted">Renewal Alert</div><div>{contract.renewalAlertDays} days before expiry</div>
              <div className="text-muted">Director approval</div><div>{contract.requiresDirectorApproval ? 'Required' : 'Not required'}</div>
              <div className="text-muted">Created</div><div>{format(new Date(contract.createdAt), 'MMM d, yyyy HH:mm')}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'workflow' && (
        <div className="card">
          <h3 className="font-semibold border-b border-border pb-4 mb-4">Workflow timeline</h3>
          <div className="timeline">
            {(contract.workflowSteps ?? []).map((s: any) => (
              <div key={s.id} className="timeline-item">
                <div className="timeline-dot"><CheckCircle size={13} /></div>
                <div className="timeline-content">
                  <div className="timeline-action">{STATUS_LABEL(s.stage)}{s.exitedAt ? '' : ' (current)'}</div>
                  <div className="timeline-meta">{format(new Date(s.enteredAt), 'MMM d, yyyy HH:mm')}{s.actor ? ` · ${s.actor.firstName} ${s.actor.lastName}` : ''}</div>
                  {s.notes && <div className="timeline-details">{s.notes}</div>}
                </div>
              </div>
            ))}
            {(contract.workflowSteps ?? []).length === 0 && <p className="text-muted text-sm">No workflow steps yet.</p>}
          </div>
        </div>
      )}

      {tab === 'versions' && (
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-semibold">Document versions</h3>
            {(role === 'legal_officer' || role === 'manager' || role === 'admin_assistant') && (
              <label className="btn btn-secondary btn-sm cursor-pointer">
                <Upload size={14} /> Upload version
                <input type="file" className="hidden" disabled={busy} onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const form = new FormData();
                  form.append('file', f);
                  runAction('versions', undefined, { form });
                  e.target.value = '';
                }} />
              </label>
            )}
          </div>
          {(contract.versions ?? []).map((v: any) => (
            <div key={v.id} className="flex items-center gap-3 p-3 bg-[var(--bg-input)] border border-border rounded-md">
              <FileIcon size={18} className="text-accent" />
              <div className="flex-1">
                <p className="font-medium text-sm m-0">v{v.version} · {v.fileName}</p>
                <p className="text-xs text-muted m-0">{(v.fileSize / 1024 / 1024).toFixed(2)} MB · {format(new Date(v.createdAt), 'MMM d, yyyy HH:mm')}</p>
              </div>
              <a href={v.fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Open</a>
            </div>
          ))}
          {(contract.versions ?? []).length === 0 && <p className="text-muted text-sm">No versions uploaded yet.</p>}
        </div>
      )}

      {tab === 'comments' && (
        <div className="card flex flex-col gap-4">
          <h3 className="font-semibold border-b border-border pb-3">Comments</h3>
          <CommentBox busy={busy} onSubmit={(text) => runAction('comments', { text })} />
          {(contract.comments ?? []).map((c: any) => (
            <div key={c.id} className="border-b border-border pb-3 last:border-0">
              <div className="flex items-center gap-2 text-sm">
                <strong>{c.author?.firstName} {c.author?.lastName}</strong>
                <span className="text-xs text-muted">{format(new Date(c.createdAt), 'MMM d, yyyy HH:mm')}</span>
              </div>
              <p className="text-sm text-muted mt-1">{c.text}</p>
            </div>
          ))}
          {(contract.comments ?? []).length === 0 && <p className="text-muted text-sm">No comments yet.</p>}
        </div>
      )}

      {tab === 'approvals' && (
        <div className="card flex flex-col gap-3">
          <h3 className="font-semibold border-b border-border pb-3">Approval history</h3>
          {(contract.approvals ?? []).map((a: any) => (
            <div key={a.id} className="flex items-start gap-3 text-sm">
              {a.decision === 'APPROVED' ? <CheckCircle size={16} className="text-success mt-0.5" /> : <XCircle size={16} className="text-danger mt-0.5" />}
              <div>
                <div><strong>{STATUS_LABEL(a.stage)}</strong> — {a.decision.toLowerCase()} by {a.approver?.firstName} {a.approver?.lastName}</div>
                <div className="text-xs text-muted">{format(new Date(a.decidedAt), 'MMM d, yyyy HH:mm')}</div>
                {a.comments && <div className="text-muted">{a.comments}</div>}
              </div>
            </div>
          ))}
          {(contract.approvals ?? []).length === 0 && <p className="text-muted text-sm">No approval decisions recorded yet.</p>}
        </div>
      )}

      {tab === 'audit' && (
        <div className="card overflow-hidden">
          <h3 className="font-semibold border-b border-border pb-4 mb-4">Audit trail</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted border-b border-border">
                <tr><th className="py-2">Date</th><th>User</th><th>Action</th><th>Details</th></tr>
              </thead>
              <tbody>
                {(contract.history ?? []).map((h: any) => (
                  <tr key={h.id} className="border-b border-border last:border-0">
                    <td className="py-3 whitespace-nowrap">{format(new Date(h.createdAt), 'MMM d, yyyy HH:mm')}</td>
                    <td>{h.actor ? `${h.actor.firstName} ${h.actor.lastName}` : 'System'}</td>
                    <td><span className="badge bg-[var(--bg-input)] text-xs">{h.action}</span></td>
                    <td className="text-muted">{h.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal === 'assign' && (
        <AssignModal officers={officers ?? []} busy={busy} onClose={() => setModal(null)} onSubmit={(assigneeId, notes) => runAction('assign', { assigneeId, notes })} />
      )}
      {modal === 'review' && (
        <DecisionModal
          title="Record legal review" busy={busy} onClose={() => setModal(null)}
          options={[{ value: 'APPROVE', label: 'Pass — send for approval' }, { value: 'RETURN', label: 'Return to requester' }]}
          onSubmit={(decision, comments) => runAction('review', { decision, comments })}
        />
      )}
      {modal === 'approve' && (
        <DecisionModal
          title="Approval decision" busy={busy} onClose={() => setModal(null)}
          options={[{ value: 'APPROVED', label: 'Approve' }, { value: 'RETURNED', label: 'Return for revision' }, { value: 'REJECTED', label: 'Reject' }]}
          onSubmit={(decision, comments) => runAction('approve', { decision, comments })}
        />
      )}
    </div>
  );
}

function CommentBox({ busy, onSubmit }: { busy: boolean; onSubmit: (text: string) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="flex gap-2">
      <textarea className="form-control flex-1" rows={2} placeholder="Add a comment…" value={text} onChange={(e) => setText(e.target.value)} />
      <button className="btn btn-primary self-end" disabled={busy || !text.trim()} onClick={() => { onSubmit(text.trim()); setText(''); }}><Send size={14} /> Post</button>
    </div>
  );
}

function AssignModal({ officers, busy, onClose, onSubmit }: { officers: Officer[]; busy: boolean; onClose: () => void; onSubmit: (id: string, notes: string) => void }) {
  const [officer, setOfficer] = useState('');
  const [notes, setNotes] = useState('');
  return (
    <Modal title="Assign officer" onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Officer</label>
        <select className="form-control" value={officer} onChange={(e) => setOfficer(e.target.value)}>
          <option value="">Select an officer…</option>
          {officers.map((o) => <option key={o.id} value={o.id}>{o.firstName} {o.lastName} ({o.role.name})</option>)}
        </select>
      </div>
      <div className="form-group mt-3">
        <label className="form-label">Notes (optional)</label>
        <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || !officer} onClick={() => onSubmit(officer, notes)}>Assign</button>
      </div>
    </Modal>
  );
}

function DecisionModal({ title, options, busy, onClose, onSubmit }: {
  title: string; options: { value: string; label: string }[]; busy: boolean; onClose: () => void; onSubmit: (decision: string, comments: string) => void;
}) {
  const [decision, setDecision] = useState(options[0].value);
  const [comments, setComments] = useState('');
  return (
    <Modal title={title} onClose={onClose}>
      <div className="form-group">
        <label className="form-label">Decision</label>
        <select className="form-control" value={decision} onChange={(e) => setDecision(e.target.value)}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="form-group mt-3">
        <label className="form-label">Comments</label>
        <textarea className="form-control" rows={3} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Required when returning or rejecting" />
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" disabled={busy} onClick={() => onSubmit(decision, comments)}>Submit decision</button>
      </div>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card w-[480px] max-w-[90%]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
          <h3 className="font-semibold m-0">{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><XCircle size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
