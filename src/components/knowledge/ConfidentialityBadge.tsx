import type { ConfidentialityLevel } from '@/types/knowledge';

const LEVEL_CLASS: Record<ConfidentialityLevel, string> = {
  PUBLIC_INTERNAL: 'urgency-low',
  RESTRICTED: 'urgency-medium',
  CONFIDENTIAL: 'urgency-high',
  HIGHLY_CONFIDENTIAL: 'urgency-critical',
};

const LEVEL_LABEL: Record<ConfidentialityLevel, string> = {
  PUBLIC_INTERNAL: 'Public / Internal',
  RESTRICTED: 'Restricted',
  CONFIDENTIAL: 'Confidential',
  HIGHLY_CONFIDENTIAL: 'Highly Confidential',
};

export function ConfidentialityBadge({ level }: { level: ConfidentialityLevel }) {
  return <span className={`badge ${LEVEL_CLASS[level]}`}>{LEVEL_LABEL[level]}</span>;
}
