'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge } from '@/components/knowledge/StatusBadge';
import { ApprovalPanel } from '@/components/knowledge/ApprovalPanel';
import { DocumentViewer } from '@/components/knowledge/DocumentViewer';
import { RoleGuard } from '@/components/knowledge/RoleGuard';
import type { ApprovalDecision, KnowledgeDocumentDetail } from '@/types/knowledge';

export default function ReviewDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard roles={['legal_officer', 'admin_assistant']}>
      <ReviewDocumentPageContent params={params} />
    </RoleGuard>
  );
}

function ReviewDocumentPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-document', id],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/documents/${id}`);
      const json = await res.json();
      return json.data as KnowledgeDocumentDetail;
    },
  });

  if (isLoading || !data) {
    return <div className="text-center py-20"><div className="spinner-sm border-accent" /></div>;
  }

  const latestVersion = data.versions[0];

  const handleDecision = async (decision: ApprovalDecision, comments: string) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/knowledge/documents/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comments }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to record review');
      }
      router.push(`/knowledge/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={`/knowledge/${id}`} className="btn btn-ghost btn-sm pl-0 mb-3">
          <ArrowLeft size={16} /> Back to Document
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-accent font-semibold">{data.documentNumber}</span>
          <StatusBadge status={data.status} />
        </div>
        <h1 className="text-2xl font-bold">Review — {data.title}</h1>
      </div>

      {error && <div className="login-alert login-alert-error">{error}</div>}

      <div className="flex gap-5 flex-wrap items-start">
        <div className="flex-1 min-w-0">
          <div className="card">
            <div className="card-header"><span className="card-title">Document Content</span></div>
            {latestVersion?.fileUrl ? (
              <DocumentViewer fileUrl={latestVersion.fileUrl} fileName={latestVersion.fileName ?? data.title} fileType={latestVersion.fileType ?? ''} />
            ) : data.content ? (
              <div className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.content }} />
            ) : (
              <div className="empty-state"><p>No content to review.</p></div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-96">
          <ApprovalPanel
            availableDecisions={['APPROVED', 'RETURNED', 'REJECTED']}
            onSubmit={handleDecision}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}
