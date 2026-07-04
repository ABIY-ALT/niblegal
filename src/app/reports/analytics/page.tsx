'use client';

import { ReportShell, KPI, Donut, TrendChart, useReportSummary, humanize } from '@/components/reports/ReportKit';

export default function AnalyticsReportPage() {
  const { data, isLoading } = useReportSummary();
  return (
    <ReportShell title="Analytics" subtitle="Cross-module volume trends and totals" loading={isLoading || !data}>
      {data && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI title="Contracts" value={data.contracts.total} />
            <KPI title="Legal Requests" value={data.advisory.total} color="success" />
            <KPI title="Knowledge Docs" value={data.knowledge.total} color="info" />
            <KPI title="SLA Compliance" value={`${data.advisory.slaCompliance}%`} color={data.advisory.slaCompliance >= 90 ? 'success' : 'danger'} />
          </div>
          <div className="card">
            <h3 className="font-semibold border-b border-border pb-3 mb-4">Volume — last 6 months</h3>
            <TrendChart series={data.trends} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card"><h3 className="font-semibold border-b border-border pb-3 mb-4">Contracts by Status</h3>
              <Donut data={Object.entries(data.contracts.byStatus).map(([k, v]) => ({ label: humanize(k), value: v }))} /></div>
            <div className="card"><h3 className="font-semibold border-b border-border pb-3 mb-4">Requests by Status</h3>
              <Donut data={Object.entries(data.advisory.byStatus).map(([k, v]) => ({ label: humanize(k), value: v }))} /></div>
          </div>
        </div>
      )}
    </ReportShell>
  );
}
