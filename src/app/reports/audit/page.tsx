'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ReportShell, KPI } from '@/components/reports/ReportKit';

interface AuditRow { id: string; module: string; action: string; details: string; user: string; ipAddress: string | null; createdAt: string; }
interface AuditResp { data: AuditRow[]; meta: { total: number; page: number; totalPages: number; byModule: Record<string, number> }; }

const MODULES = ['all', 'CMS', 'LAHD', 'KNOWLEDGE', 'SYSTEM'];

export default function AuditReportPage() {
  const [module, setModule] = useState('all');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery<AuditResp>({
    queryKey: ['audit', module, page],
    queryFn: async () => (await fetch(`/api/reports/audit?module=${module}&page=${page}&limit=50`)).json(),
  });

  return (
    <ReportShell title="Audit Trail" subtitle="Complete, immutable activity log across all modules (BR-CMS-10)" loading={isLoading && !data}>
      {data && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPI title="Total Entries" value={data.meta.total} />
            <KPI title="CMS" value={data.meta.byModule.CMS ?? 0} color="info" />
            <KPI title="LAHD" value={data.meta.byModule.LAHD ?? 0} color="success" />
            <KPI title="Knowledge" value={data.meta.byModule.KNOWLEDGE ?? 0} color="warning" />
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-border flex items-center gap-2">
              {MODULES.map((m) => (
                <button key={m} onClick={() => { setModule(m); setPage(1); }}
                  className={`btn btn-sm ${module === m ? 'btn-primary' : 'btn-ghost'}`}>{m === 'all' ? 'All' : m}</button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted border-b border-border bg-bg-input text-[11px] uppercase tracking-wider">
                  <tr><th className="py-2 px-3">Time</th><th className="px-3">Module</th><th className="px-3">User</th><th className="px-3">Action</th><th className="px-3">Details</th></tr>
                </thead>
                <tbody>
                  {data.data.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 px-3 whitespace-nowrap">{format(new Date(l.createdAt), 'MMM d, HH:mm')}</td>
                      <td className="px-3"><span className="badge bg-bg-input text-xs">{l.module}</span></td>
                      <td className="px-3">{l.user}</td>
                      <td className="px-3"><span className="badge bg-bg-input text-xs">{l.action}</span></td>
                      <td className="px-3 text-muted">{l.details}</td>
                    </tr>
                  ))}
                  {data.data.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted">No audit entries.</td></tr>}
                </tbody>
              </table>
            </div>
            {data.meta.totalPages > 1 && (
              <div className="p-3 border-t border-border flex items-center justify-end gap-2 text-sm">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn btn-ghost btn-sm disabled:opacity-30">Prev</button>
                <span className="text-muted">Page {page} / {data.meta.totalPages}</span>
                <button disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-ghost btn-sm disabled:opacity-30">Next</button>
              </div>
            )}
          </div>
        </div>
      )}
    </ReportShell>
  );
}
