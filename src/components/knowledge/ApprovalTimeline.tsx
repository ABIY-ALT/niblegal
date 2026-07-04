import { CheckCircle2, XCircle, RotateCcw, UserCog } from 'lucide-react';
import { format } from 'date-fns';
import type { KnowledgeApprovalRecord } from '@/types/knowledge';

const DECISION_ICON: Record<string, React.ReactNode> = {
  APPROVED: <CheckCircle2 />,
  REJECTED: <XCircle />,
  RETURNED: <RotateCcw />,
  DELEGATED: <UserCog />,
};

const STAGE_LABEL: Record<string, string> = {
  REVIEWER: 'Reviewer',
  MANAGER: 'Manager Approval',
};

export function ApprovalTimeline({ approvals }: { approvals: KnowledgeApprovalRecord[] }) {
  if (approvals.length === 0) {
    return (
      <div className="empty-state">
        <p>No approval decisions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="timeline">
      {approvals.map((a) => (
        <div className="timeline-item" key={a.id}>
          <div className="timeline-dot">{DECISION_ICON[a.decision]}</div>
          <div className="timeline-content">
            <div className="timeline-action">
              {STAGE_LABEL[a.stage] ?? a.stage}: {a.decision}
            </div>
            <div className="timeline-meta">
              {a.approver.firstName} {a.approver.lastName} · {format(new Date(a.decidedAt), 'MMM d, yyyy HH:mm')}
            </div>
            {a.comments && <div className="timeline-details">{a.comments}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
