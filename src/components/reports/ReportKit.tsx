'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Home, Inbox } from 'lucide-react';
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

export const PALETTE = ['#EAB308', '#16a34a', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6B7280'];

export function useReportSummary() {
  return useQuery<ReportSummary>({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const res = await fetch('/api/reports/summary');
      if (!res.ok) throw new Error(`Failed to load report summary (${res.status})`);
      return (await res.json()).data;
    },
  });
}

export const humanize = (s: string) =>
  s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

/** Shared empty state for report panels. */
export function ReportEmpty({ message = 'No data yet.' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 9, padding: '28px 14px', textAlign: 'center', color: 'var(--text-muted)',
    }}>
      <div style={{
        width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 13, background: 'var(--bg-input)', border: '1px solid var(--border)',
      }}>
        <Inbox size={19} />
      </div>
      <span style={{ fontSize: 12.5 }}>{message}</span>
    </div>
  );
}

/** Page frame: enterprise hero + breadcrumb, matching the other modules. */
export function ReportShell({ title, subtitle, actions, children, loading, error, onRetry }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="enterprise-page">
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div style={{ minWidth: 0 }}>
            <nav className="enterprise-kicker" aria-label="Breadcrumb">
              <Link href="/dashboard" className="enterprise-id" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Home size={11} /> Home
              </Link>
              <ChevronRight size={12} style={{ color: 'rgba(247,245,242,0.45)' }} />
              <Link href="/reports" className="enterprise-id" style={{ textDecoration: 'none' }}>Reports</Link>
            </nav>
            <h1 className="enterprise-title">{title}</h1>
            {subtitle && <p className="enterprise-subtitle">{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div>}
        </div>
      </div>

      {error ? (
        <div className="alert alert-danger">
          Could not load report data.
          {onRetry && (
            <button className="btn btn-sm btn-ghost" style={{ marginLeft: 10 }} onClick={onRetry}>Retry</button>
          )}
        </div>
      ) : loading ? (
        <>
          <div className="enterprise-kpi-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
        </>
      ) : children}
    </div>
  );
}

export type ReportTone = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

/**
 * KPI tile.
 *
 * The previous version built its class as `border-l-${color}`. Tailwind only
 * scans for literal class strings, so that interpolation emitted no CSS and
 * every tile rendered without its colour. These are static tone classes.
 */
export function KPI({ title, value, color = 'accent', hint, icon }: {
  title: string; value: ReactNode; color?: ReportTone; hint?: string; icon?: ReactNode;
}) {
  return (
    <div className={`enterprise-kpi tone-${color}`}>
      <div className="enterprise-kpi-head">
        <div style={{ minWidth: 0 }}>
          <div className="enterprise-kpi-label">{title}</div>
          <div className="enterprise-kpi-number">{value}</div>
        </div>
        {icon && <div className={`enterprise-kpi-icon tone-${color}`}>{icon}</div>}
      </div>
      {hint && <div className="enterprise-kpi-meta">{hint}</div>}
    </div>
  );
}

/** Panel wrapper so report sections match the rest of the app. */
export function ReportPanel({ title, icon, actions, children }: {
  title: string; icon?: ReactNode; actions?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="enterprise-panel">
      <div
        className="enterprise-panel-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        <div className="enterprise-panel-title">{icon}{title}</div>
        {actions}
      </div>
      <div className="enterprise-panel-body">{children}</div>
    </div>
  );
}

export function BarList({ data, unit }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.length === 0) return <ReportEmpty />;
  return (
    <div className="rk-barlist">
      {data.map((item, i) => (
        <div key={i} className="rk-barlist-row">
          <span className="rk-barlist-label" title={item.label}>{item.label}</span>
          <div className="rk-barlist-track">
            <div
              className="rk-barlist-fill"
              style={{ width: `${(item.value / max) * 100}%`, background: PALETTE[i % PALETTE.length] }}
            />
          </div>
          <span className="rk-barlist-value">{item.value}{unit ?? ''}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ data }: { data: { label: string; value: number }[] }) {
  const filtered = data.filter((d) => d.value > 0);
  const total = filtered.reduce((s, d) => s + d.value, 0) || 1;
  let angle = 0;
  if (filtered.length === 0) return <ReportEmpty />;
  return (
    <div className="rk-donut">
      <svg viewBox="0 0 100 100" className="rk-donut-svg" role="img" aria-label="Distribution chart">
        {/* A single category covers the full 360°, where the arc's start and end
            points coincide — SVG draws nothing for that path. Render a plain
            circle instead, otherwise a one-status donut comes out blank. */}
        {filtered.length === 1 ? (
          <circle cx="50" cy="50" r="40" fill={PALETTE[0]} />
        ) : (
          filtered.map((item, i) => {
            const a = (item.value / total) * 360;
            const s = angle; angle += a;
            const sx = 50 + 40 * Math.cos(((s - 90) * Math.PI) / 180);
            const sy = 50 + 40 * Math.sin(((s - 90) * Math.PI) / 180);
            const ex = 50 + 40 * Math.cos(((angle - 90) * Math.PI) / 180);
            const ey = 50 + 40 * Math.sin(((angle - 90) * Math.PI) / 180);
            return (
              <path
                key={i}
                d={`M 50 50 L ${sx} ${sy} A 40 40 0 ${a > 180 ? 1 : 0} 1 ${ex} ${ey} Z`}
                fill={PALETTE[i % PALETTE.length]}
                stroke="var(--surface)"
                strokeWidth="1"
              />
            );
          })
        )}
        <circle cx="50" cy="50" r="23" fill="var(--surface)" />
      </svg>
      <div className="cm-legend" style={{ flex: 1, minWidth: 0 }}>
        {filtered.map((item, i) => (
          <div key={i} className="cm-legend-row">
            <span className="cm-legend-name">
              <span className="cm-legend-swatch" style={{ background: PALETTE[i % PALETTE.length] }} />
              {item.label}
            </span>
            <span className="cm-legend-count">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendChart({ series }: { series: { month: string; contracts: number; advisory: number; knowledge: number }[] }) {
  const max = Math.max(...series.flatMap((s) => [s.contracts, s.advisory, s.knowledge]), 1);
  const keys: { k: 'contracts' | 'advisory' | 'knowledge'; color: string }[] = [
    { k: 'contracts', color: PALETTE[0] },
    { k: 'advisory', color: PALETTE[1] },
    { k: 'knowledge', color: PALETTE[2] },
  ];
  const hasData = series.some((s) => s.contracts + s.advisory + s.knowledge > 0);
  if (!hasData) return <ReportEmpty message="No activity recorded in this period." />;

  return (
    <div>
      <div className="rk-legend-row">
        {keys.map((x) => (
          <span key={x.k} className="rk-legend-item">
            <span className="cm-legend-swatch" style={{ background: x.color }} />
            {humanize(x.k)}
          </span>
        ))}
      </div>
      <div className="rk-trend">
        {series.map((s, i) => (
          <div key={i} className="rk-trend-col">
            <div className="rk-trend-bars">
              {keys.map((x) => (
                <div
                  key={x.k}
                  title={`${humanize(x.k)}: ${s[x.k]}`}
                  className="rk-trend-bar"
                  style={{
                    height: `${(s[x.k] / max) * 100}%`,
                    background: x.color,
                    minHeight: s[x.k] > 0 ? 3 : 0,
                  }}
                />
              ))}
            </div>
            <span className="rk-trend-label">{s.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
