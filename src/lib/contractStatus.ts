/**
 * Single source of truth for contract status/category presentation.
 *
 * Previously each contract page carried its own copy of these maps, and the
 * detail page derived badge classes straight from the enum
 * (`status-${status.toLowerCase().replace(/_/g, '-')}`), which produced class
 * names that had no matching CSS — those badges rendered unstyled.
 */

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under Review',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  EXECUTED: 'Executed',
  ACTIVE: 'Active',
  EXPIRING_SOON: 'Expiring Soon',
  EXPIRED: 'Expired',
  TERMINATED: 'Terminated',
  RENEWED: 'Renewed',
};

/** Maps each status onto a badge class that actually exists in index.css. */
const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'status-draft',
  UNDER_REVIEW: 'status-under-review',
  PENDING_APPROVAL: 'status-pending-approval',
  APPROVED: 'status-approved',
  EXECUTED: 'status-executed',
  ACTIVE: 'status-active',
  EXPIRING_SOON: 'status-expiring-soon',
  EXPIRED: 'status-expired',
  TERMINATED: 'status-terminated',
  RENEWED: 'status-renewed',
};

export function statusLabel(status: string): string {
  return CONTRACT_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
}

export function statusBadgeClass(status: string): string {
  return `badge ${STATUS_BADGE[status] ?? 'status-draft'}`;
}

/** Acronyms that must stay upper-case when a SCREAMING_ENUM is title-cased. */
const ACRONYMS = new Set(['IT', 'HR', 'SLA', 'NDA', 'MOU', 'ICT', 'KYC', 'AML', 'SME']);
/** Words that stay lower-case in title case, unless they lead the phrase. */
const MINOR_WORDS = new Set(['of', 'and', 'or', 'the', 'a', 'an', 'in', 'on', 'to', 'for', 'vs', 'with', 'by']);

export function categoryLabel(category: string): string {
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

/** Statuses that represent work still in the pipeline, in workflow order. */
export const PIPELINE_STATUSES = [
  'DRAFT',
  'UNDER_REVIEW',
  'PENDING_APPROVAL',
  'APPROVED',
  'EXECUTED',
  'ACTIVE',
] as const;
