import type { LegalRequestStatus } from '@prisma/client';

const TERMINAL_STATUSES: LegalRequestStatus[] = ['DISPATCHED', 'CLOSED', 'ARCHIVED', 'REJECTED'];

export function calculateDeadline(slaHours: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + slaHours * 60 * 60 * 1000);
}

export type SlaState = 'on-track' | 'at-risk' | 'breached' | 'closed';

export function getSlaState(
  deadline: Date | string,
  status: LegalRequestStatus,
  slaBreached: boolean,
): SlaState {
  if (TERMINAL_STATUSES.includes(status)) {
    return slaBreached ? 'breached' : 'closed';
  }
  const remainingMs = new Date(deadline).getTime() - Date.now();
  if (remainingMs <= 0) return 'breached';
  if (remainingMs <= 6 * 60 * 60 * 1000) return 'at-risk';
  return 'on-track';
}

export function formatRemaining(deadline: Date | string): string {
  const remainingMs = new Date(deadline).getTime() - Date.now();
  const abs = Math.abs(remainingMs);
  const hours = Math.floor(abs / (60 * 60 * 1000));
  const mins = Math.floor((abs % (60 * 60 * 1000)) / (60 * 1000));
  const label = hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h ${mins}m`;
  return remainingMs <= 0 ? `${label} overdue` : `${label} left`;
}
