'use client';

import { FileText, Layers, Users, TrendingUp } from 'lucide-react';
import {
  ReportShell, KPI, Donut, BarList, TrendChart, ReportPanel, useReportSummary,
} from '@/components/reports/ReportKit';
import { statusLabel, categoryLabel } from '@/lib/contractStatus';

export default function ContractsReportPage() {
  const { data, isLoading, isError, refetch } = useReportSummary();

  return (
    <ReportShell
      title="Contract Reports"
      subtitle="Portfolio status, categories and department distribution."
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
    >
      {data && (
        <>
          <div className="enterprise-kpi-grid cols-5">
            <KPI title="Total" value={data.contracts.total} color="accent" />
            <KPI title="Active" value={data.contracts.active} color="success" />
            <KPI title="Pending Approval" value={data.contracts.pendingApproval} color="warning" />
            <KPI title="Expiring" value={data.contracts.expiring} color="danger" />
            <KPI
              title="Portfolio Value"
              value={`${Number(data.contracts.totalValue ?? 0).toLocaleString()} ETB`}
              color="info"
            />
          </div>

          <div className="enterprise-layout" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <ReportPanel title="By Status" icon={<FileText />}>
              <Donut
                data={Object.entries(data.contracts.byStatus).map(([k, v]) => ({ label: statusLabel(k), value: v }))}
              />
            </ReportPanel>
            <ReportPanel title="By Category" icon={<Layers />}>
              <BarList
                data={data.contracts.byCategory.map((c) => ({ label: categoryLabel(c.category), value: c.count }))}
              />
            </ReportPanel>
          </div>

          <div className="enterprise-layout" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <ReportPanel title="By Requesting Department" icon={<Users />}>
              <BarList data={data.contracts.byDepartment.map((d) => ({ label: d.name, value: d.count }))} />
            </ReportPanel>
            <ReportPanel title="Volume — Last 6 Months" icon={<TrendingUp />}>
              <TrendChart series={data.trends} />
            </ReportPanel>
          </div>
        </>
      )}
    </ReportShell>
  );
}
