'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Home, Inbox, BarChart3, Table2 } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';

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

/**
 * Categorical slots, in fixed order. These resolve to the `--chart-N` tokens in
 * index.css, so they re-step for the dark surface without any JS theme check.
 *
 * Two rules ride on this array and both matter:
 *   1. A slot belongs to an *entity*, not to a row number — filtering a status
 *      out must not repaint the survivors.
 *   2. There is no 7th slot. Past six categories `foldSeries` folds the tail
 *      into "Other" rather than cycling back to slot 1, which is what the old
 *      `PALETTE[i % PALETTE.length]` did — two different statuses could come
 *      out the same colour in one chart.
 */
export const PALETTE = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--chart-6)',
];
export const OTHER_COLOR = 'var(--chart-other)';
const MAX_SLOTS = PALETTE.length;

export interface Slice { label: string; value: number }
interface PaintedSlice extends Slice { color: string }

/** Sort desc, keep the top six, sum the rest into a single "Other" slice. */
export function foldSeries(data: Slice[]): PaintedSlice[] {
  const live = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  if (live.length <= MAX_SLOTS) {
    return live.map((d, i) => ({ ...d, color: PALETTE[i] }));
  }
  const head = live.slice(0, MAX_SLOTS - 1).map((d, i) => ({ ...d, color: PALETTE[i] }));
  const rest = live.slice(MAX_SLOTS - 1);
  return [
    ...head,
    { label: `Other (${rest.length})`, value: rest.reduce((s, d) => s + d.value, 0), color: OTHER_COLOR },
  ];
}

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

const nf = new Intl.NumberFormat('en-US');
export const fmt = (n: number) => nf.format(n);

/** Shared empty state for report panels. */
export function ReportEmpty({ message = 'No data yet.' }: { message?: string }) {
  return (
    <div className="rk-empty">
      <div className="rk-empty-icon"><Inbox size={19} /></div>
      <span>{message}</span>
    </div>
  );
}

/* ── Chart chrome ──────────────────────────────────────────────────────────── */

/** Themed Recharts tooltip. Values are ink-coloured; the swatch carries identity. */
function VizTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; payload?: { color?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rk-tooltip">
      {label && <div className="rk-tooltip-head">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="rk-tooltip-row">
          <span className="rk-tooltip-dot" style={{ background: p.payload?.color ?? p.color }} />
          <span className="rk-tooltip-name">{p.name}</span>
          <strong>{fmt(Number(p.value ?? 0))}</strong>
        </div>
      ))}
    </div>
  );
}

/**
 * Chart / table switch.
 *
 * Not optional polish: three of the six light-mode slots sit below 3:1 against
 * the white card surface, and the palette's contrast check only passes on the
 * condition that the values are also reachable without relying on hue. The
 * table twin is that guarantee — it is also the keyboard/screen-reader path.
 */
function VizFrame({ head, rows, children }: {
  head: string[]; rows: (string | number)[][]; children: ReactNode;
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const id = useId();
  return (
    <div className="rk-viz">
      <div className="rk-viz-toolbar" role="group" aria-label="View as">
        <button
          type="button"
          className={`rk-viz-tab${view === 'chart' ? ' is-active' : ''}`}
          aria-pressed={view === 'chart'}
          aria-controls={id}
          onClick={() => setView('chart')}
        >
          <BarChart3 size={13} /> Chart
        </button>
        <button
          type="button"
          className={`rk-viz-tab${view === 'table' ? ' is-active' : ''}`}
          aria-pressed={view === 'table'}
          aria-controls={id}
          onClick={() => setView('table')}
        >
          <Table2 size={13} /> Table
        </button>
      </div>
      <div id={id}>
        {view === 'chart' ? children : (
          <div className="rk-table-wrap">
            <table className="rk-table">
              <thead>
                <tr>{head.map((h, i) => <th key={i} scope="col" className={i ? 'num' : undefined}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, j) => (
                      j === 0
                        ? <th key={j} scope="row">{c}</th>
                        : <td key={j} className="num">{typeof c === 'number' ? fmt(c) : c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page frame ────────────────────────────────────────────────────────────── */

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
          <div className="enterprise-kpi-number">{typeof value === 'number' ? fmt(value) : value}</div>
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

/* ── Charts ────────────────────────────────────────────────────────────────── */

/**
 * Ranked horizontal bars.
 *
 * One series, so every bar is slot 1. The old version painted each bar a
 * different categorical hue, which double-encoded length as colour and implied
 * six unrelated categories where there is only one measure.
 */
export function BarList({ data, unit }: { data: Slice[]; unit?: string }) {
  const rows = data.filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
  if (rows.length === 0) return <ReportEmpty />;
  const max = Math.max(...rows.map((d) => d.value), 1);

  return (
    <VizFrame head={['Name', `Value${unit ?? ''}`]} rows={rows.map((r) => [r.label, r.value])}>
      <div className="rk-barlist">
        {rows.map((item) => (
          <div key={item.label} className="rk-barlist-row">
            <span className="rk-barlist-label" title={item.label}>{item.label}</span>
            <div className="rk-barlist-track">
              <div className="rk-barlist-fill" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
            <span className="rk-barlist-value">{fmt(item.value)}{unit ?? ''}</span>
          </div>
        ))}
      </div>
    </VizFrame>
  );
}

/** Part-to-whole at a glance. Folded to six segments + Other. */
export function Donut({ data }: { data: Slice[] }) {
  const slices = foldSeries(data);
  if (slices.length === 0) return <ReportEmpty />;
  const total = slices.reduce((s, d) => s + d.value, 0);

  return (
    <VizFrame
      head={['Status', 'Count', 'Share']}
      rows={slices.map((s) => [s.label, s.value, `${((s.value / total) * 100).toFixed(1)}%`])}
    >
      <div className="rk-donut">
        <div className="rk-donut-figure">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="label"
                innerRadius="58%"
                outerRadius="92%"
                paddingAngle={0}
                /* 2px of the card surface between segments — a separator, not a
                   border drawn around each mark. */
                stroke="var(--surface)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map((s) => <Cell key={s.label} fill={s.color} />)}
              </Pie>
              <Tooltip content={<VizTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="rk-donut-center" aria-hidden="true">
            <span className="rk-donut-total">{fmt(total)}</span>
            <span className="rk-donut-total-label">Total</span>
          </div>
        </div>
        {/* Legend carries the value as a direct label — the relief the palette's
            sub-3:1 light slots require, so nothing is encoded by hue alone. */}
        <ul className="cm-legend" style={{ flex: 1, minWidth: 0 }}>
          {slices.map((s) => (
            <li key={s.label} className="cm-legend-row">
              <span className="cm-legend-name">
                <span className="cm-legend-swatch" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="cm-legend-count">
                {fmt(s.value)}
                <span className="cm-legend-pct">{((s.value / total) * 100).toFixed(0)}%</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </VizFrame>
  );
}

const TREND_KEYS = [
  { k: 'contracts', label: 'Contracts', color: 'var(--chart-1)' },
  { k: 'advisory', label: 'Advisory', color: 'var(--chart-2)' },
  { k: 'knowledge', label: 'Knowledge', color: 'var(--chart-3)' },
] as const;

/** Change over time — one shared y-axis for all three series, never a second scale. */
export function TrendChart({ series }: {
  series: { month: string; contracts: number; advisory: number; knowledge: number }[];
}) {
  const hasData = series.some((s) => s.contracts + s.advisory + s.knowledge > 0);
  if (!hasData) return <ReportEmpty message="No activity recorded in this period." />;

  return (
    <VizFrame
      head={['Month', 'Contracts', 'Advisory', 'Knowledge']}
      rows={series.map((s) => [s.month, s.contracts, s.advisory, s.knowledge])}
    >
      <div className="rk-legend-row">
        {TREND_KEYS.map((x) => (
          <span key={x.k} className="rk-legend-item">
            <span className="cm-legend-swatch" style={{ background: x.color }} />
            {x.label}
          </span>
        ))}
      </div>
      <div className="rk-trend">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 6, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--chart-axis)' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={42}
            />
            <Tooltip content={<VizTooltip />} cursor={{ stroke: 'var(--chart-axis)', strokeWidth: 1 }} />
            {TREND_KEYS.map((x) => (
              <Line
                key={x.k}
                type="monotone"
                dataKey={x.k}
                name={x.label}
                stroke={x.color}
                strokeWidth={2}
                dot={false}
                /* ≥8px target, with a 2px surface ring where lines overlap. */
                activeDot={{ r: 4.5, strokeWidth: 2, stroke: 'var(--surface)' }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </VizFrame>
  );
}
