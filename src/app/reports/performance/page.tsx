'use client';

import { Users, BarChart3 } from 'lucide-react';
import {
  ReportShell, KPI, BarList, ReportPanel, ReportEmpty, useReportSummary,
} from '@/components/reports/ReportKit';

export default function PerformanceReportPage() {
  const { data, isLoading, isError, refetch } = useReportSummary();

  return (
    <ReportShell
      title="Officer Performance"
      subtitle="Workload and productivity across contracts and advisory (BR-LAHD-06)."
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
    >
      {data && (
        <>
          <div className="enterprise-kpi-grid">
            <KPI title="Officers" value={data.officers.length} color="accent" icon={<Users size={19} />} />
            <KPI title="Contracts Assigned" value={data.officers.reduce((s, o) => s + o.contracts, 0)} color="info" />
            <KPI title="Advisory Assigned" value={data.officers.reduce((s, o) => s + o.advisory, 0)} color="success" />
            <KPI title="Avg Turnaround" value={`${data.advisory.avgTurnaroundHours}h`} color="warning" />
          </div>

          <ReportPanel title="Workload Distribution" icon={<BarChart3 />}>
            <BarList
              data={data.officers.map((o) => ({ label: o.name, value: o.contracts + o.advisory }))}
            />
          </ReportPanel>

          <div className="enterprise-panel">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><Users /> Productivity by Officer</div>
            </div>
            {data.officers.length === 0 ? (
              <ReportEmpty message="No officers found." />
            ) : (
              <div className="cm-table-wrap">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>Officer</th>
                      <th style={{ textAlign: 'right' }}>Contracts</th>
                      <th style={{ textAlign: 'right' }}>Advisory</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.officers.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <span className="cm-owner">
                            <span className="cm-avatar">{o.name.charAt(0)}</span>
                            {o.name}
                          </span>
                        </td>
                        <td className="cm-num">{o.contracts}</td>
                        <td className="cm-num">{o.advisory}</td>
                        <td className="cm-num" style={{ fontWeight: 800 }}>{o.contracts + o.advisory}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </ReportShell>
  );
}
