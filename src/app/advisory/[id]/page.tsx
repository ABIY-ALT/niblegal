'use client';

import { use, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Activity,
  Archive,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileEdit,
  FileText,
  FolderKanban,
  Gavel,
  History,
  Info,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  UserCog,
  Users,
  XCircle,
  Eye,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { StatusBadge } from '@/components/advisory/StatusBadge';
import { PriorityBadge } from '@/components/advisory/PriorityBadge';
import { SlaCountdown } from '@/components/advisory/SlaCountdown';
import { WorkflowTimeline } from '@/components/advisory/WorkflowTimeline';
import { ActivityTimeline } from '@/components/advisory/ActivityTimeline';
import { AuditTrailTable } from '@/components/advisory/AuditTrailTable';
import { CommentThread } from '@/components/advisory/CommentThread';
import { AttachmentManager } from '@/components/advisory/AttachmentManager';
import type { LegalRequestDetail } from '@/types/advisory';

const TABS = [
  'overview', 'workflow', 'attachments', 'comments', 'opinion',
  'approvals', 'timeline', 'history', 'audit', 'metadata',
] as const;
type Tab = (typeof TABS)[number];

const TAB_META: Record<Tab, { label: string; icon: ReactNode }> = {
  overview: { label: 'Overview', icon: <Info /> },
  workflow: { label: 'Workflow', icon: <FolderKanban /> },
  attachments: { label: 'Attachments', icon: <Paperclip /> },
  comments: { label: 'Comments', icon: <MessageSquare /> },
  opinion: { label: 'Legal Opinion', icon: <FileEdit /> },
  approvals: { label: 'Approvals', icon: <ShieldCheck /> },
  timeline: { label: 'Timeline', icon: <Activity /> },
  history: { label: 'History', icon: <History /> },
  audit: { label: 'Audit Trail', icon: <Gavel /> },
  metadata: { label: 'Metadata', icon: <FileText /> },
};

function clean(value: string) {
  return value.replace(/_/g, ' ');
}

function dateOrDash(value: string | null, pattern = 'MMM d, yyyy') {
  return value ? format(new Date(value), pattern) : '—';
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function KpiCard({ icon, label, value, meta }: { icon: ReactNode; label: string; value: ReactNode; meta: string }) {
  return (
    <div className="enterprise-kpi">
      <div className="enterprise-kpi-head">
        <div>
          <div className="enterprise-kpi-label">{label}</div>
          <div className="enterprise-kpi-value">{value}</div>
        </div>
        <div className="enterprise-kpi-icon">{icon}</div>
      </div>
      <div className="enterprise-kpi-meta">{meta}</div>
    </div>
  );
}

function Field({ label, value, icon }: { label: string; value: ReactNode; icon?: ReactNode }) {
  return (
    <div className="enterprise-field">
      <div className="enterprise-field-label">{icon}{label}</div>
      <div className="enterprise-field-value">{value}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="enterprise-detail-row">
      <span className="enterprise-detail-label">{label}</span>
      <span className="enterprise-detail-value">{value}</span>
    </div>
  );
}

export default function AdvisoryRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['advisory-request', id],
    queryFn: async () => {
      const res = await fetch(`/api/advisory/requests/${id}`);
      if (!res.ok) throw new Error('Failed to load request');
      const json = await res.json();
      return json.data as LegalRequestDetail;
    },
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['advisory-request', id] });

  const runAction = async (url: string, body?: unknown) => {
    setBusy(true);
    setActionError('');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Action failed');
      }
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="spinner-sm border-accent" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="empty-state"><p>Legal advisory request not found.</p></div>;
  }

  const isRequester = currentUser?.id === data.requester.id;
  const isAssignee = currentUser?.id === data.assignee?.id;
  const role = currentUser?.role;
  const latestActivity = data.history[0];
  const ownerName = data.assignee ? `${data.assignee.firstName} ${data.assignee.lastName}` : 'Unassigned';

  const actions = (
    <>
      {data.status === 'DRAFT' && isRequester && (
        <button className="btn btn-primary" disabled={busy} onClick={() => runAction(`/api/advisory/requests/${id}/submit`)}>
          <Send size={16} /> Submit Request
        </button>
      )}
      {data.status === 'RETURNED' && isRequester && (
        <button className="btn btn-primary" disabled={busy} onClick={() => runAction(`/api/advisory/requests/${id}/submit`)}>
          <Send size={16} /> Resubmit Request
        </button>
      )}
      {data.status === 'SUBMITTED' && (role === 'admin_assistant' || role === 'manager') && (
        <>
          <button className="btn btn-success" disabled={busy} onClick={() => runAction(`/api/advisory/requests/${id}/validate`, { approve: true })}>
            <CheckCircle2 size={16} /> Validate
          </button>
          <button className="btn btn-warning" disabled={busy} onClick={() => runAction(`/api/advisory/requests/${id}/validate`, { approve: false, notes: 'Please provide additional information.' })}>
            <XCircle size={16} /> Return
          </button>
        </>
      )}
      {(data.status === 'VALIDATED' || data.status === 'ASSIGNED') && (role === 'admin_assistant' || role === 'manager') && (
        <Link href={`/advisory/${id}/assign`} className="btn btn-secondary">
          <UserCog size={16} /> {data.status === 'VALIDATED' ? 'Assign Officer' : 'Reassign'}
        </Link>
      )}
      {(data.status === 'ASSIGNED' || data.status === 'DRAFTING' || data.status === 'RETURNED') && isAssignee && (
        <Link href={`/advisory/opinion/${id}`} className="btn btn-primary">
          <FileEdit size={16} /> Draft Opinion
        </Link>
      )}
      {data.status === 'REVIEW' && role === 'legal_officer' && (
        <Link href={`/advisory/review/${id}`} className="btn btn-primary">
          <Eye size={16} /> Review Opinion
        </Link>
      )}
      {data.status === 'PENDING_APPROVAL' && role === 'manager' && (
        <Link href={`/advisory/approval/${id}`} className="btn btn-primary">
          <Gavel size={16} /> Review Approval
        </Link>
      )}
      {data.status === 'APPROVED' && (role === 'manager' || role === 'legal_officer' || role === 'admin_assistant') && (
        <Link href={`/advisory/dispatch/${id}`} className="btn btn-primary">
          <Truck size={16} /> Dispatch
        </Link>
      )}
      {data.status === 'DISPATCHED' && (role === 'admin_assistant' || role === 'manager') && (
        <button className="btn btn-success" disabled={busy} onClick={() => runAction(`/api/advisory/requests/${id}/close`)}>
          <Archive size={16} /> Close &amp; Archive
        </button>
      )}
      {(data.status === 'CLOSED' || data.status === 'ARCHIVED') && role === 'manager' && (
        <button className="btn btn-ghost" disabled={busy} onClick={() => runAction(`/api/advisory/requests/${id}/reopen`)}>
          <RotateCcw size={16} /> Reopen
        </button>
      )}
    </>
  );

  return (
    <div className="enterprise-page">
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div>
            <Link href="/advisory/list" className="btn btn-ghost btn-sm pl-0 mb-3">
              <ArrowLeft size={16} /> Back to Requests
            </Link>
            <div className="enterprise-kicker">
              <span className="enterprise-id">{data.requestNumber}</span>
              <StatusBadge status={data.status} />
              <PriorityBadge priority={data.priority} />
              {data.requiresDirectorApproval && <span className="tag">Director Approval Required</span>}
            </div>
            <h1 className="enterprise-title">{data.subject}</h1>
            <p className="enterprise-subtitle">{data.description}</p>
          </div>
          <div className="enterprise-sla-card">
            <div className="enterprise-sla-label">
              <span>SLA health</span>
              <Clock3 size={16} />
            </div>
            <SlaCountdown slaDeadline={data.slaDeadline} slaHours={data.slaHours} status={data.status} slaBreached={data.slaBreached} />
          </div>
        </div>
      </div>

      {actionError && <div className="login-alert login-alert-error">{actionError}</div>}

      <div className="enterprise-actionbar">
        <div className="enterprise-actionbar-left">
          <span className="enterprise-actionbar-title">Workspace actions</span>
          <span className="badge status-review">{clean(data.requestType)}</span>
        </div>
        <div className="enterprise-actionbar-actions">{actions}</div>
      </div>

      <div className="enterprise-kpi-grid">
        <KpiCard icon={<FolderKanban size={20} />} label="Stage" value={clean(data.status)} meta={`Opened ${dateOrDash(data.createdAt)}`} />
        <KpiCard icon={<Users size={20} />} label="Owner" value={ownerName} meta={data.requestingDepartment.name} />
        <KpiCard icon={<Paperclip size={20} />} label="Evidence" value={data.attachments.length} meta="Uploaded attachments" />
        <KpiCard icon={<MessageSquare size={20} />} label="Collaboration" value={data.comments.length} meta={`${data.history.length} activity events`} />
      </div>

      <div className="enterprise-layout">
        <main className="enterprise-main">
          <div className="enterprise-tabs" role="tablist" aria-label="Request sections">
            {TABS.map((t) => (
              <button
                key={t}
                className={`enterprise-tab ${activeTab === t ? 'active' : ''}`}
                onClick={() => setActiveTab(t)}
                type="button"
                role="tab"
                aria-selected={activeTab === t}
              >
                {TAB_META[t].icon}
                {TAB_META[t].label}
              </button>
            ))}
          </div>

          <section className="enterprise-panel">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title">
                {TAB_META[activeTab].icon}
                {TAB_META[activeTab].label}
              </div>
            </div>
            <div className="enterprise-panel-body">
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-5">
                  <div className="enterprise-field-grid">
                    <Field label="Category" value={data.category.name} icon={<FolderKanban size={13} />} />
                    <Field label="Request Type" value={clean(data.requestType)} icon={<FileText size={13} />} />
                    <Field label="Requesting Department" value={data.requestingDepartment.name} icon={<Users size={13} />} />
                    <Field label="Requested By" value={`${data.requester.firstName} ${data.requester.lastName}`} icon={<Users size={13} />} />
                    <Field label="Assigned Officer" value={ownerName} icon={<UserCog size={13} />} />
                    <Field label="Due Date" value={dateOrDash(data.dueDate)} icon={<Clock3 size={13} />} />
                  </div>
                  <div>
                    <div className="enterprise-field-label mb-2"><FileText size={13} /> Description</div>
                    <p className="enterprise-description">{data.description}</p>
                  </div>
                  {data.relatedContract && (
                    <div className="enterprise-description">
                      <div className="enterprise-field-label mb-2">Related Contract</div>
                      <Link href={`/contracts/${data.relatedContract.id}`} className="text-accent hover:underline">
                        {data.relatedContract.contractNumber} &mdash; {data.relatedContract.title}
                      </Link>
                    </div>
                  )}
                  {data.tags.length > 0 && (
                    <div>
                      <div className="enterprise-field-label mb-2"><Sparkles size={13} /> Tags</div>
                      <div className="tags-list">
                        {data.tags.map((t) => <span key={t} className="tag">{t}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'workflow' && <WorkflowTimeline steps={data.workflowSteps} />}

              {activeTab === 'attachments' && (
                <AttachmentManager
                  mode="remote"
                  attachments={data.attachments}
                  onUpload={async (files) => {
                    const fd = new FormData();
                    files.forEach((f) => fd.append('files', f));
                    await fetch(`/api/advisory/requests/${id}/attachments`, { method: 'POST', body: fd });
                    await refetch();
                  }}
                />
              )}

              {activeTab === 'comments' && (
                <CommentThread
                  comments={data.comments}
                  onAddComment={async (text, isInternal) => {
                    await fetch(`/api/advisory/requests/${id}/comments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ text, isInternal }),
                    });
                    await refetch();
                  }}
                />
              )}

              {activeTab === 'opinion' && (
                data.opinion ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center text-sm text-muted flex-wrap gap-2">
                      <span>Version {data.opinion.currentVersion}</span>
                      {data.opinion.referenceNumber && <span>Reference: {data.opinion.referenceNumber}</span>}
                    </div>
                    <div className="enterprise-description tiptap-content" dangerouslySetInnerHTML={{ __html: data.opinion.content }} />
                    {data.opinion.versions.length > 0 && (
                      <div className="attachment-grid">
                        {data.opinion.versions.map((version) => (
                          <div className="attachment-card" key={version.id}>
                            <div className="attachment-preview"><History /></div>
                            <div>
                              <div className="attachment-name">Opinion version {version.versionNumber}</div>
                              <div className="attachment-meta">
                                {version.createdBy.firstName} {version.createdBy.lastName}<br />
                                {format(new Date(version.createdAt), 'MMM d, yyyy HH:mm')}
                              </div>
                            </div>
                            {version.changeNote && <p className="attachment-meta">{version.changeNote}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {data.opinion.digitallySignedBy && (
                      <div className="text-xs text-muted border-t border-border pt-3">
                        Digitally signed by {data.opinion.digitallySignedBy}
                        {data.opinion.digitallySignedAt && ` on ${format(new Date(data.opinion.digitallySignedAt), 'MMM d, yyyy HH:mm')}`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state"><FileEdit /><p>No legal opinion has been drafted yet.</p></div>
                )
              )}

              {activeTab === 'approvals' && (
                data.approvals.length === 0 ? (
                  <div className="empty-state"><ShieldCheck /><p>No approval decisions recorded yet.</p></div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr><th>Stage</th><th>Decision</th><th>Approver</th><th>Comments</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {data.approvals.map((a) => (
                          <tr key={a.id}>
                            <td>{clean(a.stage)}</td>
                            <td>{a.decision}</td>
                            <td>{a.approver.firstName} {a.approver.lastName}</td>
                            <td>{a.comments ?? '—'}</td>
                            <td>{format(new Date(a.decidedAt), 'MMM d, yyyy HH:mm')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {activeTab === 'timeline' && <ActivityTimeline history={data.history} />}

              {activeTab === 'history' && (
                data.history.length === 0 ? (
                  <div className="empty-state"><History /><p>No history entries yet.</p></div>
                ) : (
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr><th>Date</th><th>Action</th><th>User</th><th>Description</th></tr>
                      </thead>
                      <tbody>
                        {data.history.map((h) => (
                          <tr key={h.id}>
                            <td>{format(new Date(h.createdAt), 'MMM d, yyyy HH:mm')}</td>
                            <td>{h.action}</td>
                            <td>{h.actor ? `${h.actor.firstName} ${h.actor.lastName}` : 'System'}</td>
                            <td>{h.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}

              {activeTab === 'audit' && <AuditTrailTable logs={data.auditLogs} />}

              {activeTab === 'metadata' && (
                <div className="enterprise-field-grid">
                  <Field label="Request ID" value={<span className="font-mono text-sm">{data.id}</span>} />
                  <Field label="Confidentiality" value={clean(data.confidentiality)} />
                  <Field label="SLA Hours" value={`${data.slaHours}h`} />
                  <Field label="SLA Deadline" value={format(new Date(data.slaDeadline), 'MMM d, yyyy HH:mm')} />
                  <Field label="Created" value={format(new Date(data.createdAt), 'MMM d, yyyy HH:mm')} />
                  <Field label="Last Updated" value={format(new Date(data.updatedAt), 'MMM d, yyyy HH:mm')} />
                  <Field label="Closed At" value={dateOrDash(data.closedAt, 'MMM d, yyyy HH:mm')} />
                  <Field label="Archived At" value={dateOrDash(data.archivedAt, 'MMM d, yyyy HH:mm')} />
                </div>
              )}
            </div>
          </section>
        </main>

        <aside className="enterprise-side">
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><Info /> Request details</div>
            <div className="enterprise-detail-list">
              <DetailRow label="Requester" value={`${data.requester.firstName} ${data.requester.lastName}`} />
              <DetailRow label="Requester initials" value={initials(data.requester.firstName, data.requester.lastName)} />
              <DetailRow label="Department" value={data.requestingDepartment.name} />
              <DetailRow label="Confidentiality" value={clean(data.confidentiality)} />
              <DetailRow label="Created" value={dateOrDash(data.createdAt)} />
              <DetailRow label="Updated" value={dateOrDash(data.updatedAt, 'MMM d, yyyy HH:mm')} />
            </div>
          </div>

          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><Activity /> Activity timeline</div>
            {data.history.length > 0 ? (
              <ActivityTimeline history={data.history.slice(0, 4)} />
            ) : (
              <div className="empty-state"><p>No activity recorded yet.</p></div>
            )}
          </div>

          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><Sparkles /> Latest signal</div>
            <div className="enterprise-detail-list">
              <DetailRow label="Last event" value={latestActivity?.action ?? 'None'} />
              <DetailRow label="Actor" value={latestActivity?.actor ? `${latestActivity.actor.firstName} ${latestActivity.actor.lastName}` : 'System'} />
              <DetailRow label="When" value={latestActivity ? format(new Date(latestActivity.createdAt), 'MMM d, yyyy HH:mm') : '—'} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
