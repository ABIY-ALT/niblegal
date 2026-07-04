'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Truck, Download } from 'lucide-react';
import { StatusBadge } from '@/components/advisory/StatusBadge';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import type { LegalRequestDetail } from '@/types/advisory';

export default function DispatchPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard roles={['admin_assistant', 'manager', 'legal_officer']}>
      <DispatchPageContent params={params} />
    </RoleGuard>
  );
}

function DispatchPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [notes, setNotes] = useState('');
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

  const handleDispatch = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/advisory/requests/${id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientName, recipientEmail, notes }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to dispatch opinion');
      }
      router.push(`/advisory/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch opinion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div>
        <Link href={`/advisory/${id}`} className="btn btn-ghost btn-sm pl-0 mb-3">
          <ArrowLeft size={16} /> Back to Request
        </Link>
        <div className="flex items-center gap-3 mb-1">
          <span className="font-mono text-accent font-semibold">{data.requestNumber}</span>
          <StatusBadge status={data.status} />
        </div>
        <h1 className="text-2xl font-bold">Dispatch Legal Opinion</h1>
        <p className="text-muted text-sm">{data.subject}</p>
      </div>

      {error && <div className="login-alert login-alert-error">{error}</div>}

      <div className="card flex flex-col gap-5">
        <div className="form-group">
          <label className="form-label">Recipient *</label>
          <input
            className="form-control"
            placeholder={`e.g. ${data.requester.firstName} ${data.requester.lastName} — ${data.requestingDepartment.name}`}
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Recipient Email (Optional)</label>
          <input
            type="email"
            className="form-control"
            placeholder="For email notification"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Dispatch Notes</label>
          <textarea className="form-control" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <a href={`/api/advisory/requests/${id}/opinion/pdf`} className="btn btn-secondary">
            <Download size={16} /> Download PDF
          </a>
          <button className="btn btn-primary" disabled={submitting || !recipientName.trim()} onClick={handleDispatch}>
            <Truck size={16} /> Dispatch &amp; Notify
          </button>
        </div>
      </div>
    </div>
  );
}
