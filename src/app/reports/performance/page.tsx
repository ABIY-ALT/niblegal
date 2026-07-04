'use client';

import { ReportShell, KPI, useReportSummary } from '@/components/reports/ReportKit';

export default function PerformanceReportPage() {
  const { data, isLoading } = useReportSummary();
  return (
    <ReportShell title="Officer Performance" subtitle="Workload and productivity across contracts and advisory (BR-LAHD-06)" loading={isLoading || !data}>
      {data && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI title="Officers" value={data.officers.length} />
            <KPI title="Contracts Assigned" value={data.officers.reduce((s, o) => s + o.contracts, 0)} color="info" />
            <KPI title="Advisory Assigned" value={data.officers.reduce((s, o) => s + o.advisory, 0)} color="success" />
            <KPI title="Avg Turnaround" value={`${data.advisory.avgTurnaroundHours}h`} color="warning" />
          </div>
          <div className="card overflow-hidden">
            <h3 className="font-semibold border-b border-border pb-3 mb-2">Productivity by officer</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted border-b border-border">
                  <tr><th className="text-left py-2 px-3">Officer</th><th className="text-right py-2 px-3">Contracts</th><th className="text-right py-2 px-3">Advisory</th><th className="text-right py-2 px-3">Total</th></tr>
                </thead>
                <tbody>
                  {data.officers.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 px-3 font-medium">{o.name}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{o.contracts}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{o.advisory}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">{o.contracts + o.advisory}</td>
                    </tr>
                  ))}
                  {data.officers.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted">No officers found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </ReportShell>
  );
}
