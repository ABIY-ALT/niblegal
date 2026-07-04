import { CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';
import type { LegalWorkflowStep } from '@/types/advisory';

const STAGE_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  VALIDATED: 'Validated',
  ASSIGNED: 'Assigned',
  DRAFTING: 'Opinion Drafting',
  REVIEW: 'Peer Review',
  RETURNED: 'Returned for Correction',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  DISPATCHED: 'Dispatched',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived to Knowledge Repository',
  REJECTED: 'Rejected',
  ESCALATED: 'Escalated',
};

export function WorkflowTimeline({ steps }: { steps: LegalWorkflowStep[] }) {
  if (steps.length === 0) {
    return (
      <div className="empty-state">
        <p>No workflow activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="timeline premium-timeline">
      {steps.map((step) => {
        const isCurrent = !step.exitedAt;
        return (
          <div className="timeline-item" key={step.id}>
            <div className="timeline-dot">
              {isCurrent ? <Circle /> : <CheckCircle2 />}
            </div>
            <div className="timeline-content">
              <div className="timeline-action">{STAGE_LABEL[step.stage] ?? step.stage}</div>
              <div className="timeline-meta">
                {step.actor ? `${step.actor.firstName} ${step.actor.lastName} · ` : ''}
                {format(new Date(step.enteredAt), 'MMM d, yyyy HH:mm')}
                {step.exitedAt ? ` – ${format(new Date(step.exitedAt), 'MMM d, yyyy HH:mm')}` : ' (current stage)'}
              </div>
              {step.notes && <div className="timeline-details">{step.notes}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
