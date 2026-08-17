'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format, isPast, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import {
  Calendar, RefreshCw, Gavel, Home, ChevronRight, Building2,
  UserRound, Clock, AlertTriangle, MapPin,
} from 'lucide-react';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { caseCategoryLabel, riskBadgeClass, riskLabel } from '@/lib/litigationStatus';

interface HearingRow {
  id: string;
  type: string;
  status: string;
  scheduledAt: string;
  location: string | null;
  case: {
    id: string; caseNumber: string; title: string; court: string | null; status: string; riskLevel: string;
    assignedOfficer?: { firstName: string; lastName: string } | null;
  };
}

/** Human label for how close a hearing is. */
function whenLabel(date: Date) {
  if (isPast(date)) return { text: formatDistanceToNow(date, { addSuffix: true }), tone: 'past' as const };
  if (isToday(date)) return { text: 'Today', tone: 'urgent' as const };
  if (isTomorrow(date)) return { text: 'Tomorrow', tone: 'urgent' as const };
  return { text: formatDistanceToNow(date, { addSuffix: true }), tone: 'future' as const };
}

function CourtSchedulePage() {
  const [showPast, setShowPast] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<{ data: HearingRow[] }>({
    queryKey: ['litigation-hearings'],
    queryFn: async () => {
      const res = await fetch('/api/litigation/hearings');
      if (!res.ok) throw new Error(`Failed to load hearings (${res.status})`);
      return res.json();
    },
  });

  const allRows = useMemo(() => data?.data ?? [], [data]);
  const hearings = useMemo(
    () => (showPast ? allRows : allRows.filter((h) => !isPast(new Date(h.scheduledAt)))),
    [allRows, showPast],
  );

  const upcomingCount = allRows.filter((h) => !isPast(new Date(h.scheduledAt))).length;
  const pastCount = allRows.length - upcomingCount;
  const next7 = allRows.filter((h) => {
    const d = new Date(h.scheduledAt);
    return !isPast(d) && d.getTime() - Date.now() <= 7 * 86_400_000;
  }).length;

  if (isLoading) {
    return (
      <div className="enterprise-page">
        <div className="skeleton" style={{ height: 96, borderRadius: 'var(--radius-lg)' }} />
        <div className="enterprise-kpi-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 420, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="enterprise-page">
        <div className="alert alert-danger">
          Could not load the court schedule.
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 10 }} onClick={() => refetch()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Upcoming Hearings', value: upcomingCount, icon: <Calendar size={19} />, tone: 'accent', meta: 'Scheduled ahead' },
    { label: 'Within 7 Days', value: next7, icon: <Clock size={19} />, tone: 'warning', meta: 'Need preparation' },
    { label: 'Past Hearings', value: pastCount, icon: <Gavel size={19} />, tone: 'muted', meta: 'On record' },
  ];

  return (
    <div className="enterprise-page">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div style={{ minWidth: 0 }}>
            <nav className="enterprise-kicker" aria-label="Breadcrumb">
              <Link href="/dashboard" className="enterprise-id" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Home size={11} /> Home
              </Link>
              <ChevronRight size={12} style={{ color: 'rgba(247,245,242,0.45)' }} />
              <Link href="/litigation" className="enterprise-id" style={{ textDecoration: 'none' }}>Litigation</Link>
            </nav>
            <h1 className="enterprise-title">Court Schedule</h1>
            <p className="enterprise-subtitle">
              Hearings, verdicts and filings across every litigation case, with the
              assigned officer for each appearance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh"
              aria-label="Refresh schedule"
            >
              <RefreshCw size={14} style={isFetching ? { animation: 'spin 0.8s linear infinite' } : undefined} />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="enterprise-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {kpis.map((k) => (
          <div key={k.label} className={`enterprise-kpi tone-${k.tone}`}>
            <div className="enterprise-kpi-head">
              <div style={{ minWidth: 0 }}>
                <div className="enterprise-kpi-label">{k.label}</div>
                <div className="enterprise-kpi-number">{k.value.toLocaleString()}</div>
              </div>
              <div className={`enterprise-kpi-icon tone-${k.tone}`}>{k.icon}</div>
            </div>
            <div className="enterprise-kpi-meta">{k.meta}</div>
          </div>
        ))}
      </div>

      {/* ── Schedule ─────────────────────────────────────────────────────── */}
      <div className="enterprise-panel">
        <div className="cm-toolbar">
          <div className="enterprise-panel-title"><Calendar /> {showPast ? 'All Hearings' : 'Upcoming Hearings'}</div>
          <div className="cm-segment">
            <button className={!showPast ? 'active' : ''} onClick={() => setShowPast(false)}>
              Upcoming <span className="cm-count">{upcomingCount}</span>
            </button>
            <button className={showPast ? 'active' : ''} onClick={() => setShowPast(true)}>
              All <span className="cm-count">{allRows.length}</span>
            </button>
          </div>
        </div>

        {hearings.length === 0 ? (
          <div className="empty-state" style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{
              width: 66, height: 66, margin: '0 auto 16px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', borderRadius: 20,
              background: 'var(--bg-input)', border: '1px solid var(--border)',
            }}>
              <Gavel size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              No {showPast ? '' : 'upcoming '}hearings scheduled
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 380, margin: '0 auto' }}>
              Hearings appear here once they are added to a case file.
            </p>
          </div>
        ) : (
          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Hearing</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Officer</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {hearings.map((h) => {
                  const date = new Date(h.scheduledAt);
                  const when = whenLabel(date);
                  return (
                    <tr key={h.id}>
                      <td style={{ maxWidth: 280 }}>
                        <div className="cm-cell-strong">{h.case.title}</div>
                        <div className="cm-cell-sub">
                          <Gavel /> {h.case.caseNumber}
                          <span className={riskBadgeClass(h.case.riskLevel)} style={{ marginLeft: 6 }}>
                            {riskLabel(h.case.riskLevel)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div
                          className="cm-muted-cell"
                          style={{
                            fontWeight: 600,
                            color: when.tone === 'past' ? 'var(--text-muted)' : 'var(--text-primary)',
                          }}
                        >
                          <Calendar /> {format(date, 'MMM d, yyyy p')}
                        </div>
                        <div className="cm-cell-sub">
                          {when.tone === 'urgent' && <AlertTriangle style={{ color: 'var(--danger)' }} />}
                          {when.text}
                        </div>
                      </td>
                      <td><span className="badge status-under-review">{caseCategoryLabel(h.type)}</span></td>
                      <td>
                        <span className="cm-muted-cell">
                          {h.location ? <MapPin /> : <Building2 />}
                          {h.location ?? h.case.court ?? '—'}
                        </span>
                      </td>
                      <td>
                        {h.case.assignedOfficer ? (
                          <span className="cm-owner">
                            <span className="cm-avatar">{h.case.assignedOfficer.firstName.charAt(0)}</span>
                            {h.case.assignedOfficer.firstName} {h.case.assignedOfficer.lastName}
                          </span>
                        ) : (
                          <span className="cm-muted-cell"><UserRound /> Unassigned</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/litigation/${h.case.id}`} className="btn btn-ghost btn-sm">
                          Open case
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourtSchedulePageGuarded() {
  return (
    <RoleGuard roles={['manager', 'legal_officer', 'admin_assistant', 'requesting_organ']}>
      <CourtSchedulePage />
    </RoleGuard>
  );
}
