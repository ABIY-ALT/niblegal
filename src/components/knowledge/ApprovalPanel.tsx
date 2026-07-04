'use client';

import { useState } from 'react';
import type { ApprovalDecision } from '@/types/knowledge';

interface Props {
  availableDecisions: ApprovalDecision[];
  onSubmit: (decision: ApprovalDecision, comments: string) => Promise<void> | void;
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

export function ApprovalPanel({ availableDecisions, onSubmit, submitting }: Props) {
  const [decision, setDecision] = useState<ApprovalDecision | null>(null);
  const [comments, setComments] = useState('');

  const requiresComment = decision === 'REJECTED' || decision === 'RETURNED';

  const handleSubmit = async () => {
    if (!decision) return;
    await onSubmit(decision, comments);
    setDecision(null);
    setComments('');
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Decision</span>
      </div>
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

        <textarea
          className="form-control"
          placeholder={requiresComment ? 'Comments (required)' : 'Comments (optional)'}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
        />

        <button
          className="btn btn-primary"
          disabled={!decision || submitting || (requiresComment && !comments.trim())}
          onClick={handleSubmit}
        >
          Submit Decision
        </button>
      </div>
    </div>
  );
}
