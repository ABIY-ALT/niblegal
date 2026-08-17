'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Scale, Calendar, TrendingUp, AlertTriangle, CheckCircle, Search, Plus,
  ArrowUpRight, Coins, Gavel, ArrowRight, PieChart as PieChartIcon,
  Inbox, LayoutGrid, RefreshCw, Building2,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { ChartTooltip } from '@/components/ChartTooltip';
import { caseCategoryLabel } from '@/lib/litigationStatus';

const CATEGORY_COLORS = [
  '#EAB308', '#3b82f6', '#ef4444', '#16a34a',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16',
];

interface StatsResponse {
  summary: { activeCases: number; upcomingHearings: number; highRiskCases: number; totalExposure: number };
  categories: { category: string; count: number }[];
  trends: { month: string; count: number }[];
  upcomingHearingsList: {
    id: string; type: string; scheduledAt: string;
    case: { id: string; caseNumber: string; title: string; court: string | null };
  }[];
}

function PanelEmpty({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 9, padding: '28px 14px', textAlign: 'center', color: 'var(--text-muted)',
    }}>
      <div style={{
        width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 13, background: 'var(--bg-input)', border: '1px solid var(--border)',
      }}>
        <Inbox size={19} />
      </div>
      <span style={{ fontSize: 12.5 }}>{message}</span>
    </div>
  );
}

function LitigationDashboardInner() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: stats, isLoading, isError, refetch } = useQuery<StatsResponse>({
    queryKey: ['litigation-stats'],
    queryFn: async () => {
      const res = await fetch('/api/litigation/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  /* Previously this input stored a term that was never read by anything. */
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    router.push(q ? `/litigation/active?q=${encodeURIComponent(q)}` : '/litigation/active');
  };

  if (isLoading) {
    return (
      <div className="enterprise-page">
        <div className="skeleton" style={{ height: 118, borderRadius: 'var(--radius-lg)' }} />
        <div className="enterprise-kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 104, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        <div className="enterprise-layout">
          <div className="skeleton" style={{ height: 340, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 340, borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="enterprise-page">
        <div className="alert alert-danger">
          Could not load litigation statistics.
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 10 }} onClick={() => refetch()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const s = stats?.summary ?? { activeCases: 0, upcomingHearings: 0, highRiskCases: 0, totalExposure: 0 };
  const categories = stats?.categories ?? [];
  const trends = stats?.trends ?? [];
  const hearings = stats?.upcomingHearingsList ?? [];

  const exposureDisplay = s.totalExposure >= 1_000_000
    ? `${(s.totalExposure / 1_000_000).toFixed(1)}M`
    : s.totalExposure.toLocaleString();

  const kpis = [
    { title: 'Active Cases', value: s.activeCases.toLocaleString(), icon: <Scale size={19} />, tone: 'accent', href: '/litigation/active' },
    { title: 'Upcoming Hearings', value: s.upcomingHearings.toLocaleString(), icon: <Calendar size={19} />, tone: 'warning', href: '/litigation/schedule' },
    { title: 'High Risk Cases', value: s.highRiskCases.toLocaleString(), icon: <AlertTriangle size={19} />, tone: 'danger', href: '/litigation/active' },
    { title: 'Total Exposure', value: `${exposureDisplay} ETB`, icon: <Coins size={19} />, tone: 'info', href: '/litigation/active' },
  ];

  return (
    <div className="enterprise-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div style={{ minWidth: 0 }}>
            <div className="enterprise-kicker">
              <span className="enterprise-id">LITIGATION</span>
              <span className="badge status-active">Case Management</span>
            </div>
            <h1 className="enterprise-title">Litigation Management</h1>
            <p className="enterprise-subtitle">
              Court cases, hearing schedules and financial exposure across the bank&apos;s
              active and closed litigation portfolio.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 260 }}>
            <form onSubmit={submitSearch} className="cm-search">
              <Search />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search cases…"
                aria-label="Search litigation cases"
              />
            </form>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/litigation/active" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <LayoutGrid size={14} /> Browse
              </Link>
              <Link href="/litigation/new" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Plus size={14} /> New case
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="enterprise-kpi-grid">
        {kpis.map((k) => (
          <Link key={k.title} href={k.href} className={`enterprise-kpi tone-${k.tone}`} style={{ textDecoration: 'none' }}>
            <div className="enterprise-kpi-head">
              <div style={{ minWidth: 0 }}>
                <div className="enterprise-kpi-label">{k.title}</div>
                <div className="enterprise-kpi-number" style={{ fontSize: k.title === 'Total Exposure' ? 22 : undefined }}>
                  {k.value}
                </div>
              </div>
              <div className={`enterprise-kpi-icon tone-${k.tone}`}>{k.icon}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Main / side ──────────────────────────────────────────────────── */}
      <div className="enterprise-layout">
        <div className="enterprise-main">

          {/* Case volume trend */}
          <div className="enterprise-panel">
            <div className="enterprise-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div className="enterprise-panel-title"><TrendingUp /> Monthly Case Volume</div>
              <Link href="/reports" className="btn btn-ghost btn-sm">
                Reports <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="enterprise-panel-body">
              {trends.length === 0 ? (
                <PanelEmpty message="Not enough history to plot a trend." />
              ) : (
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltip />} />
                      <Line
                        type="monotone" dataKey="count" name="Cases"
                        stroke="var(--primary)" strokeWidth={2.5}
                        dot={{ r: 3, fill: 'var(--surface)', strokeWidth: 2 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Court schedule */}
          <div className="enterprise-panel">
            <div className="enterprise-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div className="enterprise-panel-title"><Calendar /> Court Schedule</div>
              <Link href="/litigation/schedule" className="btn btn-ghost btn-sm">
                Full schedule <ArrowRight size={13} />
              </Link>
            </div>
            {hearings.length === 0 ? (
              <div className="enterprise-panel-body">
                <PanelEmpty message="No upcoming hearings scheduled." />
              </div>
            ) : (
              <div className="cm-table-wrap">
                <table className="cm-table">
                  <thead>
                    <tr>
                      <th>Case</th>
                      <th>Hearing</th>
                      <th>Court</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hearings.map((h) => (
                      <tr key={h.id}>
                        <td>
                          <div className="cm-cell-strong">{h.case.title}</div>
                          <div className="cm-cell-sub"><Gavel /> {h.case.caseNumber}</div>
                        </td>
                        <td>
                          <div className="cm-muted-cell" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                            <Calendar /> {format(new Date(h.scheduledAt), 'MMM d, yyyy p')}
                          </div>
                          <div className="cm-cell-sub">
                            {caseCategoryLabel(h.type)} · {formatDistanceToNow(new Date(h.scheduledAt), { addSuffix: true })}
                          </div>
                        </td>
                        <td><span className="cm-muted-cell"><Building2 /> {h.case.court ?? '—'}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href={`/litigation/${h.case.id}`} className="btn btn-ghost btn-sm">Open case</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div className="enterprise-side">

          {/* Risk assessment */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><AlertTriangle /> Risk Assessment</div>
            {s.highRiskCases > 0 ? (
              <>
                <div className="cm-alert-row" style={{ display: 'block' }}>
                  <div className="cm-alert-title">
                    {s.highRiskCases} high-risk case{s.highRiskCases === 1 ? '' : 's'} open
                  </div>
                  <div className="cm-alert-sub">
                    These require an executive summary for the Board of Directors.
                  </div>
                </div>
                <Link href="/litigation/active" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                  Review high-risk cases <ArrowRight size={13} />
                </Link>
              </>
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 8, padding: '22px 8px', color: 'var(--success)', textAlign: 'center',
              }}>
                <CheckCircle size={34} style={{ opacity: 0.55 }} />
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>No high-risk cases at this time.</span>
              </div>
            )}
          </div>

          {/* Cases by type */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><PieChartIcon /> Cases by Type</div>
            {categories.length === 0 ? (
              <PanelEmpty message="No cases recorded yet." />
            ) : (
              <>
                <div style={{ height: 168, marginBottom: 10 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories} dataKey="count" nameKey="category"
                        cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3}
                        stroke="var(--surface)" strokeWidth={2}
                      >
                        {categories.map((_, i) => (
                          <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="cm-legend">
                  {categories.map((c, i) => (
                    <div key={c.category} className="cm-legend-row">
                      <span className="cm-legend-name">
                        <span className="cm-legend-swatch" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        {caseCategoryLabel(c.category)}
                      </span>
                      <span className="cm-legend-count">{c.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick access */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><LayoutGrid /> Quick Access</div>
            <div className="enterprise-detail-list">
              {[
                { label: 'Active cases', href: '/litigation/active' },
                { label: 'Court schedule', href: '/litigation/schedule' },
                { label: 'Case archive', href: '/litigation/archive' },
                { label: 'Open a new case', href: '/litigation/new' },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="enterprise-detail-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="enterprise-detail-label">{l.label}</span>
                  <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LitigationDashboard() {
  return (
    <RoleGuard roles={['manager', 'legal_officer', 'admin_assistant']}>
      <LitigationDashboardInner />
    </RoleGuard>
  );
}
