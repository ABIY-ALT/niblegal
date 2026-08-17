/**
 * Single source of truth for litigation case presentation.
 * Mirrors src/lib/contractStatus.ts so the two modules label and colour
 * their enums the same way.
 */

export const CASE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  PENDING: 'Pending',
  ON_HOLD: 'On Hold',
  SETTLED: 'Settled',
  WON: 'Won',
  LOST: 'Lost',
  DISMISSED: 'Dismissed',
  CLOSED: 'Closed',
};

/** All of these badge classes exist in index.css. */
const STATUS_BADGE: Record<string, string> = {
  ACTIVE: 'status-active',
  PENDING: 'status-pending',
  ON_HOLD: 'status-on-hold',
  SETTLED: 'status-settled',
  WON: 'status-won',
  LOST: 'status-lost',
  DISMISSED: 'status-dismissed',
  CLOSED: 'status-closed',
};

export const RISK_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const RISK_BADGE: Record<string, string> = {
  LOW: 'risk-low',
  MEDIUM: 'risk-medium',
  HIGH: 'risk-high',
  CRITICAL: 'risk-critical',
};

export function caseStatusLabel(status: string): string {
  return CASE_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function caseStatusBadgeClass(status: string): string {
  return `badge ${STATUS_BADGE[status] ?? 'status-draft'}`;
}

export function riskLabel(risk: string): string {
  return RISK_LABELS[risk] ?? risk;
}

export function riskBadgeClass(risk: string): string {
  return `badge ${RISK_BADGE[risk] ?? 'risk-low'}`;
}

/** Acronyms that must stay upper-case when a SCREAMING_ENUM is title-cased. */
const ACRONYMS = new Set(['IT', 'HR', 'NBE', 'AML', 'KYC', 'SME', 'VAT']);
/** Words that stay lower-case in title case, unless they lead the phrase. */
const MINOR_WORDS = new Set(['of', 'and', 'or', 'the', 'a', 'an', 'in', 'on', 'to', 'for', 'vs', 'with', 'by']);

export function caseCategoryLabel(category: string): string {
  return category
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((word, i) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      if (i > 0 && MINOR_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/** Statuses that count as an open matter. */
export const OPEN_CASE_STATUSES = ['ACTIVE', 'PENDING', 'ON_HOLD'] as const;
