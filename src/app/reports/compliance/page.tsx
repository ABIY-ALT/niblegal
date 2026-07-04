'use client';

import { ReportShell, KPI, Donut, useReportSummary, humanize } from '@/components/reports/ReportKit';

export default function ComplianceReportPage() {
  const { data, isLoading } = useReportSummary();
  return (
    <ReportShell title="Compliance Report" subtitle="SLA adherence, approvals, and lifecycle compliance (§3.5)" loading={isLoading || !data}>
      {data && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI title="SLA Compliance" value={`${data.advisory.slaCompliance}%`} color={data.advisory.slaCompliance >= 90 ? 'success' : 'danger'} />
            <KPI title="SLA Breaches" value={data.advisory.breached} color="danger" />
            <KPI title="Expired Contracts" value={data.contracts.expired} color="danger" />
            <KPI title="Published Knowledge" value={data.knowledge.published} color="info" hint={`${data.knowledge.total} total`} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card"><h3 className="font-semibold border-b border-border pb-3 mb-4">Contract lifecycle stage</h3>
              <Donut data={Object.entries(data.contracts.byStatus).map(([k, v]) => ({ label: humanize(k), value: v }))} /></div>
            <div className="card">
              <h3 className="font-semibold border-b border-border pb-3 mb-4">Compliance posture</h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between"><span className="text-muted">Advisory within SLA</span><strong>{data.advisory.total - data.advisory.breached}/{data.advisory.total}</strong></div>
                <div className="flex justify-between"><span className="text-muted">Contracts pending approval</span><strong>{data.contracts.pendingApproval}</strong></div>
                <div className="flex justify-between"><span className="text-muted">Contracts expiring soon</span><strong className="text-orange-600">{data.contracts.expiring}</strong></div>
                <div className="flex justify-between"><span className="text-muted">Contracts expired</span><strong className="text-red-600">{data.contracts.expired}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ReportShell>
  );
}
