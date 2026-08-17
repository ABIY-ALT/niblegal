'use client';

import Link from 'next/link';
import {
  TrendingUp, FileText, Gavel, Clock, ShieldAlert, BarChart3, Settings,
  Calendar, Download, ArrowRight, Users, BookOpen, Activity, Layers,
} from 'lucide-react';
import {
  ReportShell, KPI, BarList, Donut, TrendChart, ReportPanel, ReportEmpty,
  useReportSummary, humanize,
} from '@/components/reports/ReportKit';

/**
 * Reports hub.
 *
 * Everything on this page now comes from /api/reports/summary. It previously
 * rendered hardcoded arrays (MONTHLY_DATA, SLA_DATA) and invented KPI figures
 * — "1,284 total volume", "94.2% SLA compliance", per-department SLA
 * percentages — presented as if they were live bank data.
 */

const QUICK_REPORTS = [
  { title: 'Executive Summary', sub: 'Cross-module overview', icon: <BarChart3 />, href: '/reports/executive' },
  { title: 'Contract Analysis', sub: 'Status, category, department', icon: <FileText />, href: '/reports/contracts' },
  { title: 'Advisory Performance', sub: 'Volume and officer load', icon: <Gavel />, href: '/reports/advisory' },
  { title: 'SLA Compliance', sub: 'Turnaround and breaches', icon: <Clock />, href: '/reports/sla' },
  { title: 'Officer Performance', sub: 'Workload distribution', icon: <Users />, href: '/reports/performance' },
  { title: 'Compliance', sub: 'Regulatory posture', icon: <ShieldAlert />, href: '/reports/compliance' },
  { title: 'Analytics', sub: 'Trends over time', icon: <Activity />, href: '/reports/analytics' },
  { title: 'Audit Trail', sub: 'System-wide event log', icon: <Layers />, href: '/reports/audit' },
];

export default function ReportsHub() {
  const { data, isLoading, isError, refetch } = useReportSummary();

  return (
    <ReportShell
      title="Reports & Analytics"
      subtitle="Live operational reporting across contracts, legal advisory and the knowledge base."
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
      actions={
        <>
          <Link href="/reports/export" className="btn btn-ghost btn-sm">
            <Download size={14} /> Export
          </Link>
          <Link href="/reports/scheduled" className="btn btn-ghost btn-sm">
            <Calendar size={14} /> Scheduled
          </Link>
          <Link href="/reports/builder" className="btn btn-primary btn-sm">
            <Settings size={14} /> Report Builder
          </Link>
        </>
      }
    >
      {data && (
        <>
          {/* ── Headline KPIs (all real counts) ────────────────────────── */}
          <div className="enterprise-kpi-grid">
            <KPI
              title="Total Volume"
              value={(data.contracts.total + data.advisory.total).toLocaleString()}
              color="accent"
              icon={<TrendingUp size={19} />}
              hint={`${data.contracts.total} contracts · ${data.advisory.total} advisory`}
            />
            <KPI
              title="SLA Compliance"
              value={`${data.advisory.slaCompliance}%`}
              color={data.advisory.slaCompliance >= 90 ? 'success' : data.advisory.slaCompliance >= 75 ? 'warning' : 'danger'}
              icon={<Clock size={19} />}
              hint={
                data.advisory.total === 0
                  ? 'No advisory requests to measure'
                  : `${data.advisory.breached} breached of ${data.advisory.total}`
              }
            />
            <KPI
              title="Pending Reviews"
              value={(data.contracts.underReview + data.contracts.pendingApproval + data.advisory.pending).toLocaleString()}
              color="warning"
              icon={<FileText size={19} />}
              hint="Contracts and advisory awaiting action"
            />
            <KPI
              title="Risk Alerts"
              value={(data.contracts.expiring + data.contracts.expired + data.advisory.overdue).toLocaleString()}
              color="danger"
              icon={<ShieldAlert size={19} />}
              hint="Expiring, expired and overdue items"
            />
          </div>

          {/* ── Secondary strip ───────────────────────────────────────── */}
          <div className="enterprise-actionbar">
            <div className="enterprise-actionbar-left">
              <span className="enterprise-actionbar-title">Portfolio</span>
              <span className="badge status-active">{data.contracts.active} active contracts</span>
              <span className="badge status-executed">{data.contracts.executed} executed</span>
              <span className="badge status-approved">{data.knowledge.published} published documents</span>
              <span className="badge status-draft">{data.officers.length} officers</span>
            </div>
            <div className="enterprise-actionbar-actions">
              <Link href="/reports/executive" className="btn btn-ghost btn-sm">
                Executive summary <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* ── Main / side ───────────────────────────────────────────── */}
          <div className="enterprise-layout">
            <div className="enterprise-main">

              <ReportPanel
                title="Workload Trajectory"
                icon={<TrendingUp />}
                actions={
                  <Link href="/reports/analytics" className="btn btn-ghost btn-sm">
                    Analytics <ArrowRight size={13} />
                  </Link>
                }
              >
                <TrendChart series={data.trends} />
              </ReportPanel>

              <ReportPanel
                title="Contracts by Department"
                icon={<Users />}
                actions={
                  <Link href="/reports/contracts" className="btn btn-ghost btn-sm">
                    Detail <ArrowRight size={13} />
                  </Link>
                }
              >
                <BarList
                  data={data.contracts.byDepartment.map((d) => ({ label: d.name, value: d.count }))}
                />
              </ReportPanel>

              <ReportPanel title="Contracts by Status" icon={<FileText />}>
                <Donut
                  data={Object.entries(data.contracts.byStatus).map(([k, v]) => ({
                    label: humanize(k),
                    value: v,
                  }))}
                />
              </ReportPanel>
            </div>

            {/* ── Sidebar ────────────────────────────────────────────── */}
            <div className="enterprise-side">

              <div className="enterprise-side-card">
                <div className="enterprise-side-title"><Clock /> Advisory SLA</div>
                {data.advisory.total === 0 ? (
                  <ReportEmpty message="No advisory requests recorded yet." />
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ flex: 1, height: 8, borderRadius: 20, background: 'var(--bg-input)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${data.advisory.slaCompliance}%`, height: '100%', borderRadius: 20,
                          background: data.advisory.slaCompliance >= 90 ? 'var(--success)'
                            : data.advisory.slaCompliance >= 75 ? 'var(--warning)' : 'var(--danger)',
                        }} />
                      </div>
                      <span style={{ fontWeight: 800, fontFamily: 'Outfit, sans-serif', fontSize: 17 }}>
                        {data.advisory.slaCompliance}%
                      </span>
                    </div>
                    <div className="enterprise-detail-list">
                      <div className="enterprise-detail-row">
                        <span className="enterprise-detail-label">Avg turnaround</span>
                        <span className="enterprise-detail-value">{data.advisory.avgTurnaroundHours}h</span>
                      </div>
                      <div className="enterprise-detail-row">
                        <span className="enterprise-detail-label">Breached</span>
                        <span className="enterprise-detail-value">{data.advisory.breached}</span>
                      </div>
                      <div className="enterprise-detail-row">
                        <span className="enterprise-detail-label">Overdue (open)</span>
                        <span className="enterprise-detail-value">{data.advisory.overdue}</span>
                      </div>
                      <div className="enterprise-detail-row">
                        <span className="enterprise-detail-label">Closed</span>
                        <span className="enterprise-detail-value">{data.advisory.closed}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="enterprise-side-card">
                <div className="enterprise-side-title"><Users /> Officer Workload</div>
                {data.officers.length === 0 ? (
                  <ReportEmpty message="No officer assignments yet." />
                ) : (
                  <div className="enterprise-detail-list">
                    {data.officers.map((o) => (
                      <div key={o.id} className="enterprise-detail-row">
                        <span className="enterprise-detail-label">{o.name}</span>
                        <span className="enterprise-detail-value">{o.contracts + o.advisory} items</span>
                      </div>
                    ))}
                  </div>
                )}
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
                <Link href="/knowledge/dashboard" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                  Knowledge dashboard <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Report launcher ───────────────────────────────────────── */}
          <ReportPanel title="All Reports" icon={<BarChart3 />}>
            <div className="rk-launch-grid">
              {QUICK_REPORTS.map((r) => (
                <Link key={r.href} href={r.href} className="rk-launch">
                  <span className="rk-launch-icon">{r.icon}</span>
                  <span className="rk-launch-body">
                    <span className="rk-launch-title" style={{ display: 'block' }}>{r.title}</span>
                    <span className="rk-launch-sub" style={{ display: 'block' }}>{r.sub}</span>
                  </span>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </ReportPanel>
        </>
      )}
    </ReportShell>
  );
}
