'use client';

import Link from 'next/link';
import {
  Users, Clock, FileText, Gavel, AlertTriangle, Calendar,
  CheckCircle, XCircle, BookOpen, TrendingUp, ArrowRight,
} from 'lucide-react';
import {
  ReportShell, KPI, BarList, Donut, TrendChart, ReportPanel, ReportEmpty,
  useReportSummary,
} from '@/components/reports/ReportKit';
import { statusLabel as contractStatusLabel } from '@/lib/contractStatus';

const ADVISORY_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', VALIDATED: 'Validated', ASSIGNED: 'Assigned',
  DRAFTING: 'Drafting', REVIEW: 'Review', RETURNED: 'Returned', PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved', DISPATCHED: 'Dispatched', CLOSED: 'Closed', ARCHIVED: 'Archived',
  REJECTED: 'Rejected', ESCALATED: 'Escalated',
};

export default function ExecutiveDashboard() {
  const { data, isLoading, isError, refetch } = useReportSummary();

  return (
    <ReportShell
      title="Executive Dashboard"
      subtitle="Cross-module view of legal operations for management reporting."
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
          .map(([k, v]) => ({ label: contractStatusLabel(k), value: v }))
          .filter((i) => i.value > 0);
        const advisoryPie = Object.entries(a.byStatus)
          .map(([k, v]) => ({ label: ADVISORY_STATUS_LABELS[k] ?? k, value: v }))
          .filter((i) => i.value > 0);
        const officerProductivity = data.officers.map((o) => ({
          label: o.name,
          value: o.contracts + o.advisory,
        }));

        return (
          <>
            {/* ── Primary KPIs ───────────────────────────────────────── */}
            <div className="enterprise-kpi-grid">
              <KPI title="Total Contracts" value={c.total} color="accent" icon={<FileText size={19} />} />
              <KPI title="Active Contracts" value={c.active} color="success" icon={<CheckCircle size={19} />} />
              <KPI title="Legal Requests" value={a.total} color="info" icon={<Gavel size={19} />} />
              <KPI
                title="SLA Compliance"
                value={`${a.slaCompliance}%`}
                color={a.slaCompliance >= 90 ? 'success' : a.slaCompliance >= 75 ? 'warning' : 'danger'}
                icon={<Clock size={19} />}
                hint={`${a.avgTurnaroundHours}h average turnaround`}
              />
            </div>

            {/* ── Attention KPIs ─────────────────────────────────────── */}
            <div className="enterprise-kpi-grid">
              <KPI title="Pending Approvals" value={c.pendingApproval} color="warning" icon={<AlertTriangle size={19} />} />
              <KPI title="Expiring Contracts" value={c.expiring} color="danger" icon={<Calendar size={19} />} />
              <KPI title="Pending Requests" value={a.pending} color="warning" icon={<FileText size={19} />} />
              <KPI title="Overdue Requests" value={a.overdue} color="danger" icon={<XCircle size={19} />} />
            </div>

            <div className="enterprise-layout">
              <div className="enterprise-main">
                <ReportPanel title="Six-Month Trajectory" icon={<TrendingUp />}>
                  <TrendChart series={data.trends} />
                </ReportPanel>

                <ReportPanel title="Officer Productivity" icon={<Users />}>
                  {officerProductivity.length === 0
                    ? <ReportEmpty message="No assignments yet." />
                    : <BarList data={officerProductivity} />}
                </ReportPanel>

                <ReportPanel title="Contracts by Status" icon={<FileText />}>
                  <Donut data={contractPie} />
                </ReportPanel>

                <ReportPanel title="Advisory by Status" icon={<Gavel />}>
                  <Donut data={advisoryPie} />
                </ReportPanel>
              </div>

              <div className="enterprise-side">
                <div className="enterprise-side-card">
                  <div className="enterprise-side-title"><Clock /> Advisory SLA</div>
                  <div className="enterprise-detail-list">
                    <div className="enterprise-detail-row">
                      <span className="enterprise-detail-label">Compliance</span>
                      <span className="enterprise-detail-value">{a.slaCompliance}%</span>
                    </div>
                    <div className="enterprise-detail-row">
                      <span className="enterprise-detail-label">Overdue</span>
                      <span className="enterprise-detail-value" style={{ color: a.overdue > 0 ? 'var(--danger)' : undefined }}>
                        {a.overdue}
                      </span>
                    </div>
                    <div className="enterprise-detail-row">
                      <span className="enterprise-detail-label">Avg turnaround</span>
                      <span className="enterprise-detail-value">{a.avgTurnaroundHours}h</span>
                    </div>
                    <div className="enterprise-detail-row">
                      <span className="enterprise-detail-label">Closed</span>
                      <span className="enterprise-detail-value">{a.closed}</span>
                    </div>
                  </div>
                </div>

                <div className="enterprise-side-card">
                  <div className="enterprise-side-title"><FileText /> Contract Pipeline</div>
                  <div className="enterprise-detail-list">
                    <div className="enterprise-detail-row">
                      <span className="enterprise-detail-label">Draft</span>
                      <span className="enterprise-detail-value">{c.draft}</span>
                    </div>
                    <div className="enterprise-detail-row">
                      <span className="enterprise-detail-label">Under review</span>
                      <span className="enterprise-detail-value">{c.underReview}</span>
                    </div>
                    <div className="enterprise-detail-row">
                      <span className="enterprise-detail-label">Pending approval</span>
                      <span className="enterprise-detail-value">{c.pendingApproval}</span>
                    </div>
                    <div className="enterprise-detail-row">
                      <span className="enterprise-detail-label">Executed</span>
                      <span className="enterprise-detail-value">{c.executed}</span>
                    </div>
                    <div className="enterprise-detail-row">
                      <span className="enterprise-detail-label">Expired</span>
                      <span className="enterprise-detail-value">{c.expired}</span>
                    </div>
                  </div>
                </div>

                <div className="enterprise-side-card">
                  <div className="enterprise-side-title"><BookOpen /> Knowledge Base</div>
                  <div className="enterprise-detail-list">
                    <div className="enterprise-detail-row">
                      <span className="enterprise-detail-label">Total documents</span>
                      <span className="enterprise-detail-value">{data.knowledge.total}</span>
                    </div>
                    <div className="enterprise-detail-row">
                      <span className="enterprise-detail-label">Published</span>
                      <span className="enterprise-detail-value">{data.knowledge.published}</span>
                    </div>
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
