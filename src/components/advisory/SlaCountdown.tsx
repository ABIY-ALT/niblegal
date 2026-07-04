'use client';

import { getSlaState, formatRemaining } from '@/lib/sla';
import type { LegalRequestStatus } from '@/types/advisory';

interface Props {
  slaDeadline: string;
  slaHours: number;
  status: LegalRequestStatus;
  slaBreached: boolean;
  compact?: boolean;
}

export function SlaCountdown({ slaDeadline, slaHours, status, slaBreached, compact }: Props) {
  const state = getSlaState(slaDeadline, status, slaBreached);
  const deadlineMs = new Date(slaDeadline).getTime();
  const startMs = deadlineMs - slaHours * 60 * 60 * 1000;
  const elapsedPct = Math.min(100, Math.max(0, ((Date.now() - startMs) / (deadlineMs - startMs)) * 100));
  const fillClass = state === 'breached' ? 'sla-breach' : state === 'at-risk' ? 'sla-warn' : 'sla-ok';
  const label = state === 'closed' ? 'SLA met' : formatRemaining(slaDeadline);

  if (compact) {
    const badgeClass = state === 'breached' ? 'status-expired' : state === 'at-risk' ? 'status-warning' : 'status-approved';
    return <span className={`badge ${badgeClass}`}>{label}</span>;
  }

  return (
    <div>
      <div className="flex justify-between text-xs text-muted mb-1">
        <span>{label}</span>
      </div>
      <div className="sla-bar">
        <div className={`sla-fill ${fillClass}`} style={{ width: `${elapsedPct}%` }} />
      </div>
    </div>
  );
}
