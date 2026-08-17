'use client';

import { Gavel, Users } from 'lucide-react';
import {
  ReportShell, KPI, Donut, BarList, ReportPanel, useReportSummary, humanize,
} from '@/components/reports/ReportKit';

export default function AdvisoryReportPage() {
  const { data, isLoading, isError, refetch } = useReportSummary();

  return (
    <ReportShell
      title="Advisory Reports"
      subtitle="Legal request volume, status and officer distribution."
      loading={isLoading}
      error={isError}
      onRetry={() => refetch()}
    >
      {data && (
        <>
          <div className="enterprise-kpi-grid">
            <KPI title="Total Requests" value={data.advisory.total} color="accent" icon={<Gavel size={19} />} />
            <KPI title="Pending" value={data.advisory.pending} color="warning" />
            <KPI title="Closed" value={data.advisory.closed} color="success" />
            <KPI title="Overdue" value={data.advisory.overdue} color="danger" />
          </div>

          <div className="enterprise-layout" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <ReportPanel title="Requests by Status" icon={<Gavel />}>
              <Donut
                data={Object.entries(data.advisory.byStatus).map(([k, v]) => ({ label: humanize(k), value: v }))}
              />
            </ReportPanel>
            <ReportPanel title="Officer Workload (advisory)" icon={<Users />}>
              <BarList data={data.officers.map((o) => ({ label: o.name, value: o.advisory }))} />
            </ReportPanel>
          </div>
        </>
      )}
    </ReportShell>
  );
}
