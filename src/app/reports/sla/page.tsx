'use client';

import { ReportShell, KPI, BarList, useReportSummary } from '@/components/reports/ReportKit';

export default function SlaReportPage() {
  const { data, isLoading } = useReportSummary();
  return (
    <ReportShell title="SLA Compliance" subtitle="Advisory turnaround and SLA breach tracking (BR-LAHD-04)" loading={isLoading || !data}>
      {data && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI title="SLA Compliance" value={`${data.advisory.slaCompliance}%`} color={data.advisory.slaCompliance >= 90 ? 'success' : 'danger'} />
            <KPI title="Avg Turnaround" value={`${data.advisory.avgTurnaroundHours}h`} color="info" />
            <KPI title="Breached" value={data.advisory.breached} color="danger" />
            <KPI title="Overdue (open)" value={data.advisory.overdue} color="warning" />
          </div>
          <div className="card">
            <h3 className="font-semibold border-b border-border pb-3 mb-4">SLA compliance gauge</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-6 bg-bg-input rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${data.advisory.slaCompliance}%`, background: data.advisory.slaCompliance >= 90 ? 'var(--success)' : data.advisory.slaCompliance >= 75 ? 'var(--warning)' : 'var(--danger)' }} />
              </div>
              <span className="font-mono font-bold text-lg w-16 text-right">{data.advisory.slaCompliance}%</span>
            </div>
            <p className="text-xs text-muted mt-2">{data.advisory.total - data.advisory.breached} of {data.advisory.total} requests within SLA.</p>
          </div>
          <div className="card">
            <h3 className="font-semibold border-b border-border pb-3 mb-4">Officer workload (total items)</h3>
            <BarList data={data.officers.map((o) => ({ label: o.name, value: o.contracts + o.advisory }))} />
          </div>
        </div>
      )}
    </ReportShell>
  );
}
