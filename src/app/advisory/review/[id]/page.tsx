'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge } from '@/components/advisory/StatusBadge';
import { ApprovalPanel } from '@/components/advisory/ApprovalPanel';
import { VersionCompare } from '@/components/advisory/VersionCompare';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import type { ApprovalDecision, LegalRequestDetail } from '@/types/advisory';

export default function ReviewOpinionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard roles={['legal_officer']}>
      <ReviewOpinionPageContent params={params} />
    </RoleGuard>
  );
}

function ReviewOpinionPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['advisory-request', id],
    queryFn: async () => {
      const res = await fetch(`/api/advisory/requests/${id}`);
      const json = await res.json();
      return json.data as LegalRequestDetail;
    },
  });

  if (isLoading || !data) {
    return <div className="text-center py-20"><div className="spinner-sm border-accent" /></div>;
  }

  const versions = data.opinion?.versions ?? [];
  const oldVersion = compareIds ? versions.find((v) => v.id === compareIds[0]) : undefined;
  const newVersion = compareIds ? versions.find((v) => v.id === compareIds[1]) : undefined;

  const handleDecision = async (decision: ApprovalDecision, comments: string) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/advisory/requests/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comments }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to record review');
      }
      router.push(`/advisory/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={`/advisory/${id}`} className="btn btn-ghost btn-sm pl-0 mb-3">
          <ArrowLeft size={16} /> Back to Request
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-accent font-semibold">{data.requestNumber}</span>
          <StatusBadge status={data.status} />
        </div>
        <h1 className="text-2xl font-bold">Peer Review — {data.subject}</h1>
      </div>

      {error && <div className="login-alert login-alert-error">{error}</div>}

      <div className="flex gap-5 flex-wrap items-start">
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Legal Opinion (v{data.opinion?.currentVersion ?? 0})</span>
            </div>
            <div className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.opinion?.content ?? '<p>No content.</p>' }} />
          </div>

          {versions.length > 1 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Compare Versions</span></div>
              <div className="flex gap-3 items-end flex-wrap">
                <div className="form-group">
                  <label className="form-label">From</label>
                  <select className="form-control" onChange={(e) => setCompareIds([e.target.value, compareIds?.[1] ?? versions[0].id])}>
                    <option value="">Select version...</option>
                    {versions.map((v) => <option key={v.id} value={v.id}>v{v.versionNumber}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">To</label>
                  <select className="form-control" onChange={(e) => setCompareIds([compareIds?.[0] ?? versions[versions.length - 1].id, e.target.value])}>
                    <option value="">Select version...</option>
                    {versions.map((v) => <option key={v.id} value={v.id}>v{v.versionNumber}</option>)}
                  </select>
                </div>
              </div>
              {oldVersion && newVersion && (
                <div className="mt-4">
                  <VersionCompare oldVersion={oldVersion} newVersion={newVersion} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full lg:w-96">
          <ApprovalPanel
            approvals={data.approvals}
            availableDecisions={['APPROVED', 'RETURNED', 'REJECTED']}
            onSubmit={handleDecision}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}
