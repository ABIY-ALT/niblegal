'use client';

import { FileText, ShieldCheck } from 'lucide-react';
import {
  ReportShell, KPI, Donut, ReportPanel, useReportSummary,
} from '@/components/reports/ReportKit';
import { statusLabel } from '@/lib/contractStatus';

export default function ComplianceReportPage() {
  const { data, isLoading, isError, refetch } = useReportSummary();

  return (
    <ReportShell
      title="Compliance Report"
      subtitle="SLA adherence, approvals and contract lifecycle compliance (§3.5)."
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
            />
            <KPI title="SLA Breaches" value={data.advisory.breached} color="danger" />
            <KPI title="Expired Contracts" value={data.contracts.expired} color="danger" />
            <KPI
              title="Published Knowledge"
              value={data.knowledge.published}
              color="info"
              hint={`${data.knowledge.total} total`}
            />
          </div>

          <div className="enterprise-layout" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <ReportPanel title="Contract Lifecycle Stage" icon={<FileText />}>
              <Donut
                data={Object.entries(data.contracts.byStatus).map(([k, v]) => ({ label: statusLabel(k), value: v }))}
              />
            </ReportPanel>

            <ReportPanel title="Compliance Posture" icon={<ShieldCheck />}>
              <div className="enterprise-detail-list">
                <div className="enterprise-detail-row">
                  <span className="enterprise-detail-label">Advisory within SLA</span>
                  <span className="enterprise-detail-value">
                    {data.advisory.total - data.advisory.breached}/{data.advisory.total}
                  </span>
                </div>
                <div className="enterprise-detail-row">
                  <span className="enterprise-detail-label">Contracts pending approval</span>
                  <span className="enterprise-detail-value">{data.contracts.pendingApproval}</span>
                </div>
                <div className="enterprise-detail-row">
                  <span className="enterprise-detail-label">Contracts expiring soon</span>
                  <span
                    className="enterprise-detail-value"
                    style={{ color: data.contracts.expiring > 0 ? 'var(--warning-hover, #B45309)' : undefined }}
                  >
                    {data.contracts.expiring}
                  </span>
                </div>
                <div className="enterprise-detail-row">
                  <span className="enterprise-detail-label">Contracts expired</span>
                  <span
                    className="enterprise-detail-value"
                    style={{ color: data.contracts.expired > 0 ? 'var(--danger)' : undefined }}
                  >
                    {data.contracts.expired}
                  </span>
                </div>
              </div>
            </ReportPanel>
          </div>
        </>
      )}
    </ReportShell>
  );
}
