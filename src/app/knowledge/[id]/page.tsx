'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  ArrowLeft, Send, Archive, RotateCcw, Download, Eye, Gavel, FileEdit, Plus,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { StatusBadge } from '@/components/knowledge/StatusBadge';
import { ConfidentialityBadge } from '@/components/knowledge/ConfidentialityBadge';
import { MetadataPanel } from '@/components/knowledge/MetadataPanel';
import { DocumentViewer } from '@/components/knowledge/DocumentViewer';
import { AttachmentManager } from '@/components/knowledge/AttachmentManager';
import { CommentThread } from '@/components/knowledge/CommentThread';
import { RelatedDocuments } from '@/components/knowledge/RelatedDocuments';
import { ActivityTimeline } from '@/components/knowledge/ActivityTimeline';
import { ApprovalTimeline } from '@/components/knowledge/ApprovalTimeline';
import { AuditTrailTable } from '@/components/knowledge/AuditTrailTable';
import { BookmarkButton } from '@/components/knowledge/BookmarkButton';
import { VersionCompare } from '@/components/knowledge/VersionCompare';
import type { KnowledgeDocumentDetail } from '@/types/knowledge';

const TABS = [
  'overview', 'metadata', 'preview', 'versions', 'attachments',
  'related', 'comments', 'history', 'audit', 'downloads',
] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  overview: 'Overview',
  metadata: 'Metadata',
  preview: 'Preview',
  versions: 'Versions',
  attachments: 'Attachments',
  related: 'Related Documents',
  comments: 'Comments',
  history: 'History',
  audit: 'Audit Trail',
  downloads: 'Downloads',
};

export default function KnowledgeDocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['knowledge-document', id],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/documents/${id}`);
      if (!res.ok) throw new Error('Failed to load document');
      const json = await res.json();
      return json.data as KnowledgeDocumentDetail;
    },
  });

  useEffect(() => {
    if (data) fetch(`/api/knowledge/documents/${id}/view`, { method: 'POST' }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!data]);

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['knowledge-document', id] });

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

  const handleDownload = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/knowledge/documents/${id}/download`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Download failed');
      }
      const { data: file } = await res.json();
      const a = document.createElement('a');
      a.href = file.fileUrl;
      a.download = file.fileName;
      a.click();
      await refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Download failed');
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
    return <div className="empty-state"><p>Knowledge document not found.</p></div>;
  }

  const role = currentUser?.role;
  const isAuthor = currentUser?.id === data.author.id;
  const myBookmark = data.bookmarks.find((b) => b.userId === currentUser?.id);
  const latestVersion = data.versions[0];

  return (
    <RoleGuard roles={['manager', 'legal_officer', 'admin_assistant', 'requesting_organ']}>
      <div className="flex flex-col gap-5">
        <div>
          <Link href="/knowledge/list" className="btn btn-ghost btn-sm pl-0 mb-3">
            <ArrowLeft size={16} /> Back to Repository
          </Link>
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="font-mono text-accent font-semibold">{data.documentNumber}</span>
                <StatusBadge status={data.status} />
                <ConfidentialityBadge level={data.confidentiality} />
              </div>
              <h1 className="text-2xl font-bold">{data.title}</h1>
            </div>
            {currentUser && (
              <BookmarkButton
                documentId={id}
                isBookmarked={!!myBookmark}
                isPinned={myBookmark?.isPinned ?? false}
                onChange={refetch}
              />
            )}
          </div>
        </div>

        {actionError && <div className="login-alert login-alert-error">{actionError}</div>}

        <div className="flex flex-wrap gap-2">
          {data.status === 'DRAFT' && isAuthor && (
            <button className="btn btn-primary" disabled={busy} onClick={() => runAction(`/api/knowledge/documents/${id}/submit`)}>
              <Send size={16} /> Submit for Review
            </button>
          )}
          {data.status === 'UNDER_REVIEW' && (role === 'legal_officer' || role === 'admin_assistant') && !isAuthor && (
            <Link href={`/knowledge/${id}/review`} className="btn btn-primary">
              <Eye size={16} /> Review Document
            </Link>
          )}
          {data.status === 'APPROVED' && role === 'manager' && (
            <Link href={`/knowledge/${id}/approve`} className="btn btn-primary">
              <Gavel size={16} /> Manager Approval
            </Link>
          )}
          {data.status === 'PUBLISHED' && (role === 'admin_assistant' || role === 'manager') && (
            <button className="btn btn-warning" disabled={busy} onClick={() => runAction(`/api/knowledge/documents/${id}/archive`)}>
              <Archive size={16} /> Archive
            </button>
          )}
          {data.status === 'ARCHIVED' && (role === 'admin_assistant' || role === 'manager') && (
            <button className="btn btn-ghost" disabled={busy} onClick={() => runAction(`/api/knowledge/documents/${id}/restore`)}>
              <RotateCcw size={16} /> Restore
            </button>
          )}
          {role !== 'requesting_organ' && (
            <Link href={`/knowledge/${id}/versions/new`} className="btn btn-secondary">
              <Plus size={16} /> New Version
            </Link>
          )}
          {latestVersion?.fileUrl && (
            <button className="btn btn-secondary" disabled={busy} onClick={handleDownload}>
              <Download size={16} /> Download
            </button>
          )}
          {latestVersion?.fileUrl && (
            <Link href={`/knowledge/viewer/${id}`} className="btn btn-secondary">
              <FileEdit size={16} /> Full-Screen Viewer
            </Link>
          )}
        </div>

        <div className="tabs">
          {TABS.map((t) => (
            <button key={t} className={`tab-btn ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)}>
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="card">
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-5">
              <div className="form-row cols-2">
                <div><div className="form-label mb-1">Category</div><div>{data.category.name}</div></div>
                <div><div className="form-label mb-1">Owner</div><div>{data.author.firstName} {data.author.lastName}</div></div>
              </div>
              <div>
                <div className="form-label mb-1">Description</div>
                <p className="text-sm leading-relaxed">{data.description || 'No description provided.'}</p>
              </div>
              {data.content && (
                <div>
                  <div className="form-label mb-1">Content</div>
                  <div className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.content }} />
                </div>
              )}
              {(data.relatedContract || data.relatedLegalRequest || data.relatedDepartment) && (
                <div className="form-row cols-2">
                  {data.relatedContract && (
                    <div>
                      <div className="form-label mb-1">Related Contract</div>
                      <Link href={`/contracts/${data.relatedContract.id}`} className="text-accent hover:underline">
                        {data.relatedContract.contractNumber} — {data.relatedContract.title}
                      </Link>
                    </div>
                  )}
                  {data.relatedLegalRequest && (
                    <div>
                      <div className="form-label mb-1">Related Legal Request</div>
                      <Link href={`/advisory/${data.relatedLegalRequest.id}`} className="text-accent hover:underline">
                        {data.relatedLegalRequest.requestNumber} — {data.relatedLegalRequest.subject}
                      </Link>
                    </div>
                  )}
                  {data.relatedDepartment && (
                    <div><div className="form-label mb-1">Related Department</div><div>{data.relatedDepartment.name}</div></div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'metadata' && <MetadataPanel doc={data} />}

          {activeTab === 'preview' && (
            latestVersion?.fileUrl ? (
              <DocumentViewer fileUrl={latestVersion.fileUrl} fileName={latestVersion.fileName ?? data.title} fileType={latestVersion.fileType ?? ''} />
            ) : data.content ? (
              <div className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.content }} />
            ) : (
              <div className="empty-state"><p>No file or content available to preview yet.</p></div>
            )
          )}

          {activeTab === 'versions' && (
            data.versions.length === 0 ? (
              <div className="empty-state"><p>No versions uploaded yet.</p></div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr><th>Version</th><th>File</th><th>Uploaded By</th><th>Approved By</th><th>Date</th><th>Notes</th></tr>
                    </thead>
                    <tbody>
                      {data.versions.map((v) => (
                        <tr key={v.id}>
                          <td>v{v.versionNumber}{v.versionNumber === data.currentVersion && <span className="tag ml-2">Current</span>}</td>
                          <td>{v.fileName ?? (v.content ? 'Text content' : '—')}</td>
                          <td>{v.uploadedBy.firstName} {v.uploadedBy.lastName}</td>
                          <td>{v.approvedBy ? `${v.approvedBy.firstName} ${v.approvedBy.lastName}` : '—'}</td>
                          <td>{format(new Date(v.createdAt), 'MMM d, yyyy')}</td>
                          <td>{v.changes ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {data.versions.length > 1 && (
                  <div>
                    <div className="form-label mb-2">Compare Versions</div>
                    <div className="flex gap-3 items-end flex-wrap mb-4">
                      <div className="form-group">
                        <label className="form-label">From</label>
                        <select className="form-control" onChange={(e) => setCompareIds([e.target.value, compareIds?.[1] ?? data.versions[0].id])}>
                          <option value="">Select version...</option>
                          {data.versions.map((v) => <option key={v.id} value={v.id}>v{v.versionNumber}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">To</label>
                        <select className="form-control" onChange={(e) => setCompareIds([compareIds?.[0] ?? data.versions[data.versions.length - 1].id, e.target.value])}>
                          <option value="">Select version...</option>
                          {data.versions.map((v) => <option key={v.id} value={v.id}>v{v.versionNumber}</option>)}
                        </select>
                      </div>
                    </div>
                    {compareIds && (() => {
                      const oldV = data.versions.find((v) => v.id === compareIds[0]);
                      const newV = data.versions.find((v) => v.id === compareIds[1]);
                      return oldV && newV ? <VersionCompare oldVersion={oldV} newVersion={newV} /> : null;
                    })()}
                  </div>
                )}
              </div>
            )
          )}

          {activeTab === 'attachments' && (
            <AttachmentManager
              mode="remote"
              attachments={data.attachments}
              onUpload={async (files) => {
                const fd = new FormData();
                files.forEach((f) => fd.append('files', f));
                await fetch(`/api/knowledge/documents/${id}/attachments`, { method: 'POST', body: fd });
                await refetch();
              }}
            />
          )}

          {activeTab === 'related' && <RelatedDocuments documents={data.relatedDocuments} />}

          {activeTab === 'comments' && (
            <CommentThread
              comments={data.comments}
              onAddComment={async (text, isInternal) => {
                await fetch(`/api/knowledge/documents/${id}/comments`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ text, isInternal }),
                });
                await refetch();
              }}
            />
          )}

          {activeTab === 'history' && (
            <div className="flex flex-col gap-6">
              {data.approvals.length > 0 && (
                <div>
                  <div className="form-label mb-2">Approval Timeline</div>
                  <ApprovalTimeline approvals={data.approvals} />
                </div>
              )}
              <div>
                <div className="form-label mb-2">Activity</div>
                <ActivityTimeline history={data.history} />
              </div>
            </div>
          )}

          {activeTab === 'audit' && <AuditTrailTable logs={data.auditLogs} />}

          {activeTab === 'downloads' && (
            data.downloadLogs.length === 0 ? (
              <div className="empty-state"><p>No downloads recorded yet.</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead><tr><th>User</th><th>Date</th></tr></thead>
                  <tbody>
                    {data.downloadLogs.map((d) => (
                      <tr key={d.id}>
                        <td>{d.user.firstName} {d.user.lastName}</td>
                        <td>{format(new Date(d.createdAt), 'MMM d, yyyy HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
