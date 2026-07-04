'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, UserCog, AlertTriangle } from 'lucide-react';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import type { LegalRequestDetail, UserRef } from '@/types/advisory';

export default function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard roles={['admin_assistant', 'manager']}>
      <AssignmentPageContent params={params} />
    </RoleGuard>
  );
}

function AssignmentPageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

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
      return json.data as UserRef[];
    },
  });

  const [officerId, setOfficerId] = useState('');
  const [priority, setPriority] = useState('');
  const [slaHours, setSlaHours] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isLoading || !data) {
    return <div className="text-center py-20"><div className="spinner-sm border-accent" /></div>;
  }

  const submit = async (action: 'ASSIGNED' | 'REASSIGNED' | 'ESCALATED' | 'PRIORITY_CHANGED' | 'SLA_UPDATED') => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/advisory/requests/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          officerId: officerId || undefined,
          priority: priority || undefined,
          slaHours: slaHours || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Assignment failed');
      }
      router.push(`/advisory/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isReassignment = !!data.assignee;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div>
        <Link href={`/advisory/${id}`} className="btn btn-ghost btn-sm pl-0 mb-3">
          <ArrowLeft size={16} /> Back to Request
        </Link>
        <h1 className="text-2xl font-bold mb-1">{isReassignment ? 'Reassign / Manage' : 'Assign'} Legal Officer</h1>
        <p className="text-muted text-sm">{data.requestNumber} — {data.subject}</p>
      </div>

      {error && <div className="login-alert login-alert-error">{error}</div>}

      <div className="card flex flex-col gap-5">
        <div className="text-sm text-muted">
          Currently assigned to: <strong>{data.assignee ? `${data.assignee.firstName} ${data.assignee.lastName}` : 'Unassigned'}</strong>
        </div>

        <div className="form-group">
          <label className="form-label">Assign to Officer</label>
          <select className="form-control" value={officerId} onChange={(e) => setOfficerId(e.target.value)}>
            <option value="">Keep current assignee</option>
            {officers?.map((o) => (
              <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>
            ))}
          </select>
        </div>

        <div className="form-row cols-2">
          <div className="form-group">
            <label className="form-label">Update Priority</label>
            <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">Keep current ({data.priority})</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Update SLA (hours)</label>
            <input
              type="number"
              min={1}
              className="form-control"
              placeholder={`Current: ${data.slaHours}h`}
              value={slaHours}
              onChange={(e) => setSlaHours(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-control" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for assignment, escalation, or SLA change..." />
        </div>

        <div className="flex flex-wrap gap-3 justify-end pt-3 border-t border-border">
          <button
            className="btn btn-danger"
            disabled={submitting || !notes.trim()}
            onClick={() => submit('ESCALATED')}
            title="Requires notes explaining the escalation"
          >
            <AlertTriangle size={16} /> Escalate
          </button>
          <button
            className="btn btn-primary"
            disabled={submitting}
            onClick={() => submit(isReassignment ? 'REASSIGNED' : 'ASSIGNED')}
          >
            <UserCog size={16} /> {isReassignment ? 'Reassign' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
