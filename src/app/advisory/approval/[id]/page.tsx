'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { StatusBadge } from '@/components/advisory/StatusBadge';
import { ApprovalPanel } from '@/components/advisory/ApprovalPanel';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import type { ApprovalDecision, LegalRequestDetail, UserRef } from '@/types/advisory';

export default function ManagerApprovalPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard roles={['manager']}>
      <ManagerApprovalPageContent params={params} />
    </RoleGuard>
  );
}

function ManagerApprovalPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['advisory-request', id],
    queryFn: async () => {
      const res = await fetch(`/api/advisory/requests/${id}`);
      const json = await res.json();
      return json.data as LegalRequestDetail;
    },
  });

  const { data: officers } = useQuery({
    queryKey: ['advisory-officers'],
    queryFn: async () => {
      const res = await fetch('/api/advisory/officers');
      const json = await res.json();
      return json.data as (UserRef & { role: { name: string } })[];
    },
  });

  const currentStage = useMemo(() => {
    if (!data) return 'DIVISION_MANAGER';
    const lastManagerApproval = [...data.approvals]
      .filter((a) => a.stage === 'DIVISION_MANAGER' || a.stage === 'LEGAL_DIRECTOR')
      .sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime())[0];
    return lastManagerApproval?.stage === 'DIVISION_MANAGER' &&
      lastManagerApproval.decision === 'APPROVED' &&
      data.requiresDirectorApproval
      ? 'LEGAL_DIRECTOR'
      : 'DIVISION_MANAGER';
  }, [data]);

  if (isLoading || !data) {
    return <div className="text-center py-20"><div className="spinner-sm border-accent" /></div>;
  }

  const handleDecision = async (decision: ApprovalDecision, comments: string, delegatedToId?: string) => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/advisory/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comments, delegatedToId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to record decision');
      }
      router.push(`/advisory/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record decision');
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
          <span className="tag">{currentStage === 'LEGAL_DIRECTOR' ? 'Legal Director Approval' : 'Division Manager Approval'}</span>
        </div>
        <h1 className="text-2xl font-bold">{data.subject}</h1>
      </div>

      {error && <div className="login-alert login-alert-error">{error}</div>}

      <div className="flex gap-5 flex-wrap items-start">
        <div className="flex-1 min-w-0">
          <div className="card">
            <div className="card-header">
              <span className="card-title">Legal Opinion (v{data.opinion?.currentVersion ?? 0})</span>
            </div>
            <div className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.opinion?.content ?? '<p>No content.</p>' }} />
          </div>
        </div>

        <div className="w-full lg:w-96">
          <ApprovalPanel
            approvals={data.approvals}
            availableDecisions={['APPROVED', 'RETURNED', 'REJECTED', 'DELEGATED']}
            delegateOptions={officers?.filter((o) => o.role.name === 'Manager' && o.id !== data.assignee?.id)}
            onSubmit={handleDecision}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  );
}
