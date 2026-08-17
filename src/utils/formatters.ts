import { formatDistanceToNow, format, differenceInHours, isPast } from 'date-fns';
import type { ContractStatus, AdvisoryStatus, UserRole, ContractCategory, AdvisoryCategory, KnowledgeItemType } from '../types';

export function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  try { return format(new Date(iso), 'dd MMM yyyy'); } catch { return '—'; }
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  try { return format(new Date(iso), 'dd MMM yyyy, HH:mm'); } catch { return '—'; }
}

export function timeAgo(iso: string): string {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return ''; }
}

export function slaHoursRemaining(deadline: string): number {
  return differenceInHours(new Date(deadline), new Date());
}

export function isSLABreached(deadline: string, status: string): boolean {
  return isPast(new Date(deadline)) && !['dispatched', 'closed', 'executed', 'active', 'expired', 'terminated'].includes(status);
}

export function formatCurrency(amount: number, currency = 'ETB'): string {
  return `${currency} ${amount.toLocaleString('en-ET')}`;
}

// ─── Label Maps ───────────────────────────────────────────────────────────────

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Draft', under_review: 'Under Review', pending_approval: 'Pending Approval',
  approved: 'Approved', executed: 'Executed', active: 'Active',
  expiring_soon: 'Expiring Soon', expired: 'Expired', terminated: 'Terminated', renewed: 'Renewed',
};

export const CONTRACT_STATUS_COLORS: Record<ContractStatus, string> = {
  draft: 'status-draft', under_review: 'status-review', pending_approval: 'status-pending',
  approved: 'status-approved', executed: 'status-executed', active: 'status-active',
  expiring_soon: 'status-warning', expired: 'status-expired', terminated: 'status-terminated', renewed: 'status-renewed',
};

export const CONTRACT_CATEGORY_LABELS: Record<string, string> = {
  service_agreement: 'Service Agreement',
  lease: 'Lease',
  nda: 'NDA',
  procurement: 'Procurement',
  employment: 'Employment',
  loan_agreement: 'Loan Agreement',
  partnership: 'Partnership',
  consultancy: 'Consultancy',
  other: 'Other',
};

export const ADVISORY_STATUS_LABELS: Record<AdvisoryStatus, string> = {
  submitted: 'Submitted', assigned: 'Assigned', drafting: 'Drafting',
  under_review: 'Under Review', pending_approval: 'Pending Approval',
  approved: 'Approved', dispatched: 'Dispatched', closed: 'Closed',
};

export const ADVISORY_STATUS_COLORS: Record<AdvisoryStatus, string> = {
  submitted: 'status-draft', assigned: 'status-review', drafting: 'status-review',
  under_review: 'status-review', pending_approval: 'status-pending',
  approved: 'status-approved', dispatched: 'status-active', closed: 'status-executed',
};

export const URGENCY_COLORS: Record<string, string> = {
  low: 'urgency-low', medium: 'urgency-medium', high: 'urgency-high', critical: 'urgency-critical',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin_assistant: 'Admin Assistant', legal_officer: 'Legal Officer',
  manager: 'Manager / Director', requesting_organ: 'Requesting Department',
};

export function formatContractCategory(category: string): string {
  return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function formatAdvisoryCategory(category: string): string {
  return category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeItemType, string> = {
  template: 'Template', legal_opinion: 'Legal Opinion',
  legal_update: 'Legal Update', article: 'Article', standard_clause: 'Standard Clause',
};

export const KNOWLEDGE_TYPE_ICONS: Record<KnowledgeItemType, string> = {
  template: '📄', legal_opinion: '⚖️', legal_update: '📰', article: '📝', standard_clause: '📋',
};
