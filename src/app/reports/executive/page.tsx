'use client';

import Link from 'next/link';
import {
  Users, Clock, FileText, Gavel, AlertTriangle,
  CheckCircle, BookOpen, TrendingUp, ArrowRight, ShieldCheck,
} from 'lucide-react';
import {
  ReportShell, KPI, BarList, Donut, TrendChart, ReportPanel, ReportEmpty,
  useReportSummary, fmt,
} from '@/components/reports/ReportKit';
import { statusLabel as contractStatusLabel } from '@/lib/contractStatus';

const ADVISORY_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', VALIDATED: 'Validated', ASSIGNED: 'Assigned',
  DRAFTING: 'Drafting', REVIEW: 'Review', RETURNED: 'Returned', PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved', DISPATCHED: 'Dispatched', CLOSED: 'Closed', ARCHIVED: 'Archived',
  REJECTED: 'Rejected', ESCALATED: 'Escalated',
};

type Severity = 'critical' | 'warning' | 'good';

/**
 * Exception band.
 *
 * Reads as a management "what needs attention" line rather than more tiles.
 * Every item ships an icon and a written severity word — the colour repeats the
 * severity, it never carries it alone.
 */
function ExceptionBar({ items }: { items: { severity: Severity; label: string; count: number; href: string }[] }) {
  const live = items.filter((i) => i.count > 0);
  if (live.length === 0) {
    return (
      <div className="exec-exceptions is-clear">
        <ShieldCheck size={16} />
        <span><strong>All clear.</strong> No overdue requests, expiring contracts or approvals waiting.</span>
      </div>
    );
  }
  return (
    <div className="exec-exceptions">
      <span className="exec-exceptions-title"><AlertTriangle size={15} /> Needs attention</span>
      <div className="exec-exceptions-items">
        {live.map((i) => (
          <Link key={i.label} href={i.href} className={`exec-exception sev-${i.severity}`}>
            <span className="exec-exception-count">{fmt(i.count)}</span>
            <span className="exec-exception-label">
              {i.label}
              <span className="exec-exception-sev">{i.severity === 'critical' ? 'Critical' : 'Warning'}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatRow({ label, value, tone }: { label: string; value: string | number; tone?: 'danger' }) {
  return (
    <div className="enterprise-detail-row">
      <span className="enterprise-detail-label">{label}</span>
      <span className="enterprise-detail-value" style={tone === 'danger' ? { color: 'var(--danger)' } : undefined}>
        {typeof value === 'number' ? fmt(value) : value}
      </span>
    </div>
  );
}

export default function ExecutiveDashboard() {
  const { data, isLoading, isError, refetch } = useReportSummary();

  const asOf = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <ReportShell
      title="Executive Dashboard"
      subtitle={`Cross-module view of legal operations for management reporting · as at ${asOf}`}
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      actions={
        <Link href="/reports/export" className="btn btn-ghost btn-sm">
          Export <ArrowRight size={13} />
        </Link>
      }
    >
      {data && (() => {
        const c = data.contracts;
        const a = data.advisory;

        const contractPie = Object.entries(c.byStatus)
          .map(([k, v]) => ({ label: contractStatusLabel(k), value: v }));
        const advisoryPie = Object.entries(a.byStatus)
          .map(([k, v]) => ({ label: ADVISORY_STATUS_LABELS[k] ?? k, value: v }));
        const officerProductivity = data.officers.map((o) => ({
          label: o.name,
          value: o.contracts + o.advisory,
        }));

        const slaTone = a.slaCompliance >= 90 ? 'success' : a.slaCompliance >= 75 ? 'warning' : 'danger';

        return (
          <>
            {/* ── Headline KPIs ──────────────────────────────────────── */}
            <div className="enterprise-kpi-grid">
              <KPI title="Total Contracts" value={c.total} color="accent" icon={<FileText size={19} />}
                   hint={`${fmt(c.active)} currently active`} />
              <KPI title="Legal Requests" value={a.total} color="info" icon={<Gavel size={19} />}
                   hint={`${fmt(a.closed)} closed to date`} />
              <KPI title="SLA Compliance" value={`${a.slaCompliance}%`} color={slaTone} icon={<Clock size={19} />}
                   hint={`${a.avgTurnaroundHours}h average turnaround`} />
              <KPI title="Knowledge Base" value={data.knowledge.total} color="muted" icon={<BookOpen size={19} />}
                   hint={`${fmt(data.knowledge.published)} published`} />
            </div>

            {/* ── Exceptions ─────────────────────────────────────────── */}
            <ExceptionBar
              items={[
                { severity: 'critical', label: 'Overdue requests', count: a.overdue, href: '/advisory/list' },
                { severity: 'critical', label: 'Expiring contracts', count: c.expiring, href: '/expiry' },
                { severity: 'warning', label: 'Contracts awaiting approval', count: c.pendingApproval, href: '/contracts' },
                { severity: 'warning', label: 'Requests pending', count: a.pending, href: '/advisory/list' },
              ]}
            />

            <div className="enterprise-layout">
              <div className="enterprise-main">
                <ReportPanel title="Six-Month Trajectory" icon={<TrendingUp />}>
                  <TrendChart series={data.trends} />
                </ReportPanel>

                <div className="exec-split">
                  <ReportPanel title="Contracts by Status" icon={<FileText />}>
                    <Donut data={contractPie} />
                  </ReportPanel>
                  <ReportPanel title="Advisory by Status" icon={<Gavel />}>
                    <Donut data={advisoryPie} />
                  </ReportPanel>
                </div>

                <ReportPanel title="Officer Productivity" icon={<Users />}>
                  {officerProductivity.length === 0
                    ? <ReportEmpty message="No assignments yet." />
                    : <BarList data={officerProductivity} />}
                </ReportPanel>
              </div>

              <div className="enterprise-side">
                <div className="enterprise-side-card">
                  <div className="enterprise-side-title"><Clock /> Advisory SLA</div>
                  <div className="enterprise-detail-list">
                    <StatRow label="Compliance" value={`${a.slaCompliance}%`} />
                    <StatRow label="Overdue" value={a.overdue} tone={a.overdue > 0 ? 'danger' : undefined} />
                    <StatRow label="Breached" value={a.breached} tone={a.breached > 0 ? 'danger' : undefined} />
                    <StatRow label="Avg turnaround" value={`${a.avgTurnaroundHours}h`} />
                    <StatRow label="Closed" value={a.closed} />
                  </div>
                </div>

                <div className="enterprise-side-card">
                  <div className="enterprise-side-title"><FileText /> Contract Pipeline</div>
                  <div className="enterprise-detail-list">
                    <StatRow label="Draft" value={c.draft} />
                    <StatRow label="Under review" value={c.underReview} />
                    <StatRow label="Pending approval" value={c.pendingApproval} />
                    <StatRow label="Executed" value={c.executed} />
                    <StatRow label="Expired" value={c.expired} />
                  </div>
                </div>

                <div className="enterprise-side-card">
                  <div className="enterprise-side-title"><CheckCircle /> Position</div>
                  <div className="enterprise-detail-list">
                    <StatRow label="Active contracts" value={c.active} />
                    <StatRow label="Expiring soon" value={c.expiring} tone={c.expiring > 0 ? 'danger' : undefined} />
                    <StatRow label="Requests pending" value={a.pending} />
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </ReportShell>
  );
}
