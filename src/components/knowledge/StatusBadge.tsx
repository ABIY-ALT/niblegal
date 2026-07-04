import type { KnowledgeStatus } from '@/types/knowledge';

const STATUS_CLASS: Record<KnowledgeStatus, string> = {
  DRAFT: 'status-draft',
  UNDER_REVIEW: 'status-review',
  APPROVED: 'status-approved',
  PUBLISHED: 'status-active',
  ARCHIVED: 'status-renewed',
  EXPIRED: 'status-expired',
};

const STATUS_LABEL: Record<KnowledgeStatus, string> = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
  EXPIRED: 'Expired',
};

export function StatusBadge({ status }: { status: KnowledgeStatus }) {
  return <span className={`badge ${STATUS_CLASS[status]}`}>{STATUS_LABEL[status]}</span>;
}
