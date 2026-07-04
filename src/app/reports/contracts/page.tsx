'use client';

import { ReportShell, KPI, Donut, BarList, TrendChart, useReportSummary, humanize } from '@/components/reports/ReportKit';

export default function ContractsReportPage() {
  const { data, isLoading } = useReportSummary();
  return (
    <ReportShell title="Contract Reports" subtitle="Portfolio status, categories, and department distribution" loading={isLoading || !data}>
      {data && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KPI title="Total" value={data.contracts.total} />
            <KPI title="Active" value={data.contracts.active} color="success" />
            <KPI title="Pending Approval" value={data.contracts.pendingApproval} color="warning" />
            <KPI title="Expiring" value={data.contracts.expiring} color="danger" />
            <KPI title="Portfolio Value" value={`${data.contracts.totalValue.toLocaleString()} ETB`} color="info" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card"><h3 className="font-semibold border-b border-border pb-3 mb-4">By Status</h3>
              <Donut data={Object.entries(data.contracts.byStatus).map(([k, v]) => ({ label: humanize(k), value: v }))} /></div>
            <div className="card"><h3 className="font-semibold border-b border-border pb-3 mb-4">By Category</h3>
              <BarList data={data.contracts.byCategory.map((c) => ({ label: humanize(c.category), value: c.count }))} /></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card"><h3 className="font-semibold border-b border-border pb-3 mb-4">By Requesting Department</h3>
              <BarList data={data.contracts.byDepartment.map((d) => ({ label: d.name, value: d.count }))} /></div>
            <div className="card"><h3 className="font-semibold border-b border-border pb-3 mb-4">Volume — last 6 months</h3>
              <TrendChart series={data.trends} /></div>
          </div>
        </div>
      )}
    </ReportShell>
  );
}
