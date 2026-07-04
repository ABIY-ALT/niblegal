'use client';

import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

export interface ReportSummary {
  contracts: {
    total: number; active: number; draft: number; underReview: number; pendingApproval: number;
    executed: number; expiring: number; expired: number; totalValue: number;
    byStatus: Record<string, number>;
    byCategory: { category: string; count: number }[];
    byDepartment: { name: string; count: number }[];
  };
  advisory: {
    total: number; pending: number; closed: number; overdue: number; breached: number;
    slaCompliance: number; avgTurnaroundHours: number; byStatus: Record<string, number>;
  };
  officers: { id: string; name: string; contracts: number; advisory: number }[];
  knowledge: { total: number; published: number };
  trends: { month: string; contracts: number; advisory: number; knowledge: number }[];
}

export const PALETTE = ['#B8860B', '#2E8B57', '#4682B4', '#CD853F', '#FF6347', '#32CD32', '#FFD700', '#808080', '#DDA0DD', '#20B2AA'];

export function useReportSummary() {
  return useQuery<ReportSummary>({
    queryKey: ['reports-summary'],
    queryFn: async () => (await (await fetch('/api/reports/summary')).json()).data,
  });
}

export const humanize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

export function ReportShell({ title, subtitle, actions, children, loading }: {
  title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold m-0">{title}</h1>
          {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {loading ? (
        <div className="grid grid-cols-4 gap-4 animate-pulse">{[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-bg-surface rounded-xl" />)}</div>
      ) : children}
    </div>
  );
}

export function KPI({ title, value, color = 'accent', hint }: { title: string; value: ReactNode; color?: string; hint?: string }) {
  return (
    <div className={`card card-sm border-l-4 border-l-${color}`}>
      <div className="text-muted text-[10px] font-bold uppercase tracking-wider mb-1">{title}</div>
      <div className="text-2xl font-bold font-mono">{value}</div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </div>
  );
}

export function BarList({ data, unit }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0) return <p className="text-muted text-sm">No data yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-sm w-40 truncate">{item.label}</span>
          <div className="flex-1 h-5 bg-bg-input rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
          </div>
          <span className="text-sm font-semibold w-14 text-right">{item.value}{unit ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ data }: { data: { label: string; value: number }[] }) {
  const filtered = data.filter((d) => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0) || 1;
  let angle = 0;
  if (filtered.length === 0) return <p className="text-muted text-sm">No data yet.</p>;
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg viewBox="0 0 100 100" className="w-36 h-36">
        {filtered.map((item, i) => {
          const a = (item.value / total) * 360;
          const s = angle; angle += a;
          const sx = 50 + 40 * Math.cos(((s - 90) * Math.PI) / 180);
          const sy = 50 + 40 * Math.sin(((s - 90) * Math.PI) / 180);
          const ex = 50 + 40 * Math.cos(((angle - 90) * Math.PI) / 180);
          const ey = 50 + 40 * Math.sin(((angle - 90) * Math.PI) / 180);
          return <path key={i} d={`M 50 50 L ${sx} ${sy} A 40 40 0 ${a > 180 ? 1 : 0} 1 ${ex} ${ey} Z`} fill={PALETTE[i % PALETTE.length]} />;
        })}
        <circle cx="50" cy="50" r="22" fill="var(--bg-card)" />
      </svg>
      <div className="flex flex-col gap-1.5">
        {filtered.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span>{item.label}: <strong>{item.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendChart({ series }: { series: { month: string; contracts: number; advisory: number; knowledge: number }[] }) {
  const max = Math.max(...series.flatMap((s) => [s.contracts, s.advisory, s.knowledge]), 1);
  const keys: { k: 'contracts' | 'advisory' | 'knowledge'; color: string }[] = [
    { k: 'contracts', color: PALETTE[0] }, { k: 'advisory', color: PALETTE[1] }, { k: 'knowledge', color: PALETTE[2] },
  ];
  return (
    <div>
      <div className="flex gap-4 mb-3 text-xs">
        {keys.map((x) => <span key={x.k} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: x.color }} />{humanize(x.k)}</span>)}
      </div>
      <div className="flex items-end gap-4 h-48">
        {series.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-1 h-40 w-full justify-center">
              {keys.map((x) => (
                <div key={x.k} title={`${humanize(x.k)}: ${s[x.k]}`} className="w-3 rounded-t transition-all" style={{ height: `${(s[x.k] / max) * 100}%`, background: x.color, minHeight: s[x.k] > 0 ? 2 : 0 }} />
              ))}
            </div>
            <span className="text-xs text-muted">{s.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
