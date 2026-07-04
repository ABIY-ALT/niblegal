'use client';

import { ReportShell, KPI, Donut, BarList, useReportSummary, humanize } from '@/components/reports/ReportKit';

export default function AdvisoryReportPage() {
  const { data, isLoading } = useReportSummary();
  return (
    <ReportShell title="Advisory Reports" subtitle="Legal request volume, status, and officer distribution" loading={isLoading || !data}>
      {data && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI title="Total Requests" value={data.advisory.total} />
            <KPI title="Pending" value={data.advisory.pending} color="warning" />
            <KPI title="Closed" value={data.advisory.closed} color="success" />
            <KPI title="Overdue" value={data.advisory.overdue} color="danger" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card"><h3 className="font-semibold border-b border-border pb-3 mb-4">Requests by Status</h3>
              <Donut data={Object.entries(data.advisory.byStatus).map(([k, v]) => ({ label: humanize(k), value: v }))} /></div>
            <div className="card"><h3 className="font-semibold border-b border-border pb-3 mb-4">Officer Workload (advisory)</h3>
              <BarList data={data.officers.map((o) => ({ label: o.name, value: o.advisory }))} /></div>
          </div>
        </div>
      )}
    </ReportShell>
  );
}
