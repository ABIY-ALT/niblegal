'use client';

import { TrendingUp, FileText, Gavel } from 'lucide-react';
import {
  ReportShell, KPI, Donut, TrendChart, ReportPanel, useReportSummary, humanize,
} from '@/components/reports/ReportKit';
import { statusLabel } from '@/lib/contractStatus';

export default function AnalyticsReportPage() {
  const { data, isLoading, isError, refetch } = useReportSummary();

  return (
    <ReportShell
      title="Analytics"
      subtitle="Cross-module volume trends and totals."
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
    >
      {data && (
        <>
          <div className="enterprise-kpi-grid">
            <KPI title="Contracts" value={data.contracts.total} color="accent" />
            <KPI title="Legal Requests" value={data.advisory.total} color="success" />
            <KPI title="Knowledge Docs" value={data.knowledge.total} color="info" />
            <KPI
              title="SLA Compliance"
              value={`${data.advisory.slaCompliance}%`}
              color={data.advisory.slaCompliance >= 90 ? 'success' : data.advisory.slaCompliance >= 75 ? 'warning' : 'danger'}
            />
          </div>

          <ReportPanel title="Volume — Last 6 Months" icon={<TrendingUp />}>
            <TrendChart series={data.trends} />
          </ReportPanel>

          <div className="enterprise-layout" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <ReportPanel title="Contracts by Status" icon={<FileText />}>
              <Donut
                data={Object.entries(data.contracts.byStatus).map(([k, v]) => ({ label: statusLabel(k), value: v }))}
              />
            </ReportPanel>
            <ReportPanel title="Requests by Status" icon={<Gavel />}>
              <Donut
                data={Object.entries(data.advisory.byStatus).map(([k, v]) => ({ label: humanize(k), value: v }))}
              />
            </ReportPanel>
          </div>
        </>
      )}
    </ReportShell>
  );
}
