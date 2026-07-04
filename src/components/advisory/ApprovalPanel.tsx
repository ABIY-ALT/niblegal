'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { ApprovalDecision, LegalApprovalRecord, UserRef } from '@/types/advisory';

interface Props {
  approvals: LegalApprovalRecord[];
  availableDecisions: ApprovalDecision[];
  delegateOptions?: UserRef[];
  onSubmit: (decision: ApprovalDecision, comments: string, delegatedToId?: string) => Promise<void> | void;
  submitting?: boolean;
}

const DECISION_LABEL: Record<ApprovalDecision, string> = {
  APPROVED: 'Approve',
  REJECTED: 'Reject',
  RETURNED: 'Return for Correction',
  DELEGATED: 'Delegate',
};

const DECISION_BTN_CLASS: Record<ApprovalDecision, string> = {
  APPROVED: 'btn-success',
  REJECTED: 'btn-danger',
  RETURNED: 'btn-warning',
  DELEGATED: 'btn-secondary',
};

export function ApprovalPanel({ approvals, availableDecisions, delegateOptions, onSubmit, submitting }: Props) {
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);
  const [comments, setComments] = useState('');
  const [delegatedToId, setDelegatedToId] = useState('');

  const requiresComment = decision === 'REJECTED' || decision === 'RETURNED';
  const requiresDelegate = decision === 'DELEGATED';

  const handleSubmit = async () => {
    if (!decision) return;
    await onSubmit(decision, comments, requiresDelegate ? delegatedToId || undefined : undefined);
    setDecision(null);
    setComments('');
    setDelegatedToId('');
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Decision</span>
      </div>

      {approvals.length > 0 && (
        <div className="flex flex-col gap-2 mb-5 pb-5 border-b border-border">
          {approvals.map((a) => (
            <div key={a.id} className="text-sm flex justify-between gap-3">
              <span>
                <strong>{a.stage.replace('_', ' ')}</strong>: {DECISION_LABEL[a.decision]} by {a.approver.firstName} {a.approver.lastName}
                {a.comments ? ` — "${a.comments}"` : ''}
              </span>
              <span className="text-muted shrink-0">{format(new Date(a.decidedAt), 'MMM d, yyyy HH:mm')}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-2 flex-wrap">
          {availableDecisions.map((d) => (
            <button
              key={d}
              type="button"
              className={`btn btn-sm ${decision === d ? DECISION_BTN_CLASS[d] : 'btn-ghost'}`}
              onClick={() => setDecision(d)}
            >
              {DECISION_LABEL[d]}
            </button>
          ))}
        </div>

        {requiresDelegate && delegateOptions && (
          <select className="form-control" value={delegatedToId} onChange={(e) => setDelegatedToId(e.target.value)}>
            <option value="">Select delegate...</option>
            {delegateOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.firstName} {o.lastName}
              </option>
            ))}
          </select>
        )}

        <textarea
          className="form-control"
          placeholder={requiresComment ? 'Comments (required)' : 'Comments (optional)'}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
        />

        <button
          className="btn btn-primary"
          disabled={!decision || submitting || (requiresComment && !comments.trim()) || (requiresDelegate && !delegatedToId)}
          onClick={handleSubmit}
        >
          Submit Decision
        </button>
      </div>
    </div>
  );
}
