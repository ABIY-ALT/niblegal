import type { Priority } from '@/types/advisory';

const PRIORITY_CLASS: Record<Priority, string> = {
  LOW: 'urgency-low',
  MEDIUM: 'urgency-medium',
  HIGH: 'urgency-high',
  URGENT: 'urgency-high',
  CRITICAL: 'urgency-critical',
};

const PRIORITY_LABEL: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
  CRITICAL: 'Critical',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge ${PRIORITY_CLASS[priority]}`}>{PRIORITY_LABEL[priority]}</span>;
}
