'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react';
import { OpinionEditor } from '@/components/advisory/OpinionEditor';
import { StatusBadge } from '@/components/advisory/StatusBadge';
import type { LegalRequestDetail } from '@/types/advisory';

export default function OpinionDraftEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
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

  if (isLoading || !data) {
    return <div className="text-center py-20"><div className="spinner-sm border-accent" /></div>;
  }

  const readOnly = !['ASSIGNED', 'DRAFTING', 'RETURNED'].includes(data.status);

  const handleSave = async (content: string, changeNote?: string) => {
    await fetch(`/api/advisory/requests/${id}/opinion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, changeNote }),
    });
    queryClient.invalidateQueries({ queryKey: ['advisory-request', id] });
  };

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/advisory/requests/${id}/opinion/submit-review`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to submit for review');
      }
      router.push(`/advisory/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for review');
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
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-accent font-semibold">{data.requestNumber}</span>
              <StatusBadge status={data.status} />
            </div>
            <h1 className="text-2xl font-bold">Legal Opinion — {data.subject}</h1>
          </div>
          {!readOnly && (
            <button className="btn btn-primary" disabled={submitting} onClick={handleSubmitForReview}>
              <Send size={16} /> Submit for Review
            </button>
          )}
        </div>
      </div>

      {error && <div className="login-alert login-alert-error">{error}</div>}
      {readOnly && (
        <div className="login-alert login-alert-error" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', borderColor: 'var(--warning)' }}>
          This opinion is read-only in its current stage ({data.status.replace(/_/g, ' ')}).
        </div>
      )}

      <OpinionEditor initialContent={data.opinion?.content ?? ''} onSave={handleSave} readOnly={readOnly} />
    </div>
  );
}
