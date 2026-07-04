import type { LegalRequestStatus } from '@/types/advisory';

const STATUS_CLASS: Record<LegalRequestStatus, string> = {
  DRAFT: 'status-draft',
  SUBMITTED: 'status-pending',
  VALIDATED: 'status-active',
  ASSIGNED: 'status-active',
  DRAFTING: 'status-review',
  REVIEW: 'status-review',
  RETURNED: 'status-warning',
  PENDING_APPROVAL: 'status-pending',
  APPROVED: 'status-approved',
  DISPATCHED: 'status-executed',
  CLOSED: 'status-renewed',
  ARCHIVED: 'status-renewed',
  REJECTED: 'status-expired',
  ESCALATED: 'status-warning',
};

const STATUS_LABEL: Record<LegalRequestStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  VALIDATED: 'Validated',
  ASSIGNED: 'Assigned',
  DRAFTING: 'Drafting',
  REVIEW: 'In Review',
  RETURNED: 'Returned',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  DISPATCHED: 'Dispatched',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
  REJECTED: 'Rejected',
  ESCALATED: 'Escalated',
};

export function StatusBadge({ status }: { status: LegalRequestStatus }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}
