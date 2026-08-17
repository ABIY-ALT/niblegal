'use client';

import { Clock, Gauge, Users } from 'lucide-react';
import {
  ReportShell, KPI, BarList, ReportPanel, useReportSummary,
} from '@/components/reports/ReportKit';

export default function SlaReportPage() {
  const { data, isLoading, isError, refetch } = useReportSummary();

  return (
    <ReportShell
      title="SLA Compliance"
      subtitle="Advisory turnaround and SLA breach tracking (BR-LAHD-04)."
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
    >
      {data && (
        <>
          <div className="enterprise-kpi-grid">
            <KPI
              title="SLA Compliance"
              value={`${data.advisory.slaCompliance}%`}
              color={data.advisory.slaCompliance >= 90 ? 'success' : data.advisory.slaCompliance >= 75 ? 'warning' : 'danger'}
              icon={<Clock size={19} />}
            />
            <KPI title="Avg Turnaround" value={`${data.advisory.avgTurnaroundHours}h`} color="info" />
            <KPI title="Breached" value={data.advisory.breached} color="danger" />
            <KPI title="Overdue (open)" value={data.advisory.overdue} color="warning" />
          </div>

          <ReportPanel title="SLA Compliance Gauge" icon={<Gauge />}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ flex: 1, height: 22, borderRadius: 20, background: 'var(--bg-input)', overflow: 'hidden' }}>
                <div style={{
                  width: `${data.advisory.slaCompliance}%`, height: '100%', borderRadius: 20,
                  transition: 'width 0.4s ease',
                  background: data.advisory.slaCompliance >= 90 ? 'var(--success)'
                    : data.advisory.slaCompliance >= 75 ? 'var(--warning)' : 'var(--danger)',
                }} />
              </div>
              <span style={{
                width: 68, textAlign: 'right', fontFamily: 'Outfit, sans-serif',
                fontSize: 20, fontWeight: 800, color: 'var(--text-primary)',
              }}>
                {data.advisory.slaCompliance}%
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
              {data.advisory.total === 0
                ? 'No advisory requests recorded yet — this figure is a default, not a measured result.'
                : `${data.advisory.total - data.advisory.breached} of ${data.advisory.total} requests within SLA.`}
            </p>
          </ReportPanel>

          <ReportPanel title="Officer Workload (total items)" icon={<Users />}>
            <BarList data={data.officers.map((o) => ({ label: o.name, value: o.contracts + o.advisory }))} />
          </ReportPanel>
        </>
      )}
    </ReportShell>
  );
}
