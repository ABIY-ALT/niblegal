'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  FileText, Clock, CheckCircle, ShieldAlert, Plus, FileSignature,
  Search, ArrowUpRight, Activity, PieChart as PieIcon, LayoutGrid,
  Inbox, RefreshCw, Calendar, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ChartTooltip } from '@/components/ChartTooltip';
import { statusLabel, statusBadgeClass, categoryLabel } from '@/lib/contractStatus';

const CATEGORY_COLORS = [
  '#3b82f6', '#16a34a', '#EAB308', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#ef4444', '#84cc16',
];

type StatsResponse = {
  summary: Record<string, number>;
  categories: { category: string; count: number }[];
};
type AuditEntry = {
  id: string; module: string; action: string;
  details: string | null; user: string; createdAt: string;
};
type ExpiringContract = {
  id: string; contractNumber: string; title: string;
  counterparty: string; status: string; expiryDate: string | null;
};

async function getJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

function PanelEmpty({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)',
    }}>
      <div style={{
        width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 14, background: 'var(--bg-input)', border: '1px solid var(--border)',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 13 }}>{message}</span>
    </div>
  );
}

export default function ContractsDashboard() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data: me } = useCurrentUser();

  // The audit endpoint is restricted to legal staff; requesting organs get a 403,
  // so the activity panel is only requested for roles that may read it.
  const canReadAudit = !!me && ['manager', 'legal_officer', 'admin_assistant'].includes(me.role);

  const statsQuery = useQuery<StatsResponse>({
    queryKey: ['contracts-stats'],
    queryFn: () => getJson('/api/contracts/stats'),
  });

  const activityQuery = useQuery<{ data: AuditEntry[] }>({
    queryKey: ['contracts-activity'],
    queryFn: () => getJson('/api/reports/audit?module=CMS&limit=6'),
    enabled: canReadAudit,
  });

  const expiringQuery = useQuery<{ data: ExpiringContract[] }>({
    queryKey: ['contracts-expiring-preview'],
    queryFn: () => getJson('/api/contracts?status=EXPIRING_SOON&limit=5'),
  });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/contracts/list?q=${encodeURIComponent(q)}` : '/contracts/list');
  };

  if (statsQuery.isLoading) {
    return (
      <div className="enterprise-page">
        <div className="skeleton" style={{ height: 118, borderRadius: 'var(--radius-lg)' }} />
        <div className="enterprise-kpi-grid cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 108, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        <div className="enterprise-layout">
          <div className="skeleton" style={{ height: 340, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 340, borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    );
  }

  if (statsQuery.isError) {
    return (
      <div className="enterprise-page">
        <div className="alert alert-danger">
          Could not load contract statistics.
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 10 }} onClick={() => statsQuery.refetch()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const s = statsQuery.data?.summary ?? {};
  const num = (k: string) => Number(s[k] ?? 0);
  const categories = statsQuery.data?.categories ?? [];

  const kpis = [
    { title: 'Total Contracts', value: num('total'), icon: <FileText size={19} />, tone: 'accent', href: '/contracts/list' },
    { title: 'Drafts', value: num('draft'), icon: <FileText size={19} />, tone: 'muted', href: '/contracts/drafts' },
    { title: 'Under Review', value: num('review'), icon: <Clock size={19} />, tone: 'info', href: '/contracts/review' },
    { title: 'Pending Approval', value: num('pendingApproval'), icon: <CheckCircle size={19} />, tone: 'warning', href: '/contracts/approval' },
    { title: 'Executed', value: num('executed'), icon: <FileSignature size={19} />, tone: 'success', href: '/contracts/executed' },
    { title: 'Expiring Soon', value: num('expiring'), icon: <ShieldAlert size={19} />, tone: 'danger', href: '/contracts/expiring' },
  ];

  /* Pipeline distribution — real server-side counts from /api/contracts/stats.
     (This replaces a hardcoded six-month "processing volume" line chart; no
     endpoint exposes historical volume, so nothing here is invented.) */
  const pipeline = [
    { stage: 'Draft', count: num('draft'), fill: '#6B7280' },
    { stage: 'Review', count: num('review'), fill: '#3b82f6' },
    { stage: 'Approval', count: num('pendingApproval'), fill: '#EAB308' },
    { stage: 'Approved', count: num('approved'), fill: '#16a34a' },
    { stage: 'Executed', count: num('executed'), fill: '#CA8A04' },
    { stage: 'Active', count: num('active'), fill: '#15803D' },
  ];
  const pipelineTotal = pipeline.reduce((t, p) => t + p.count, 0);

  const activity = activityQuery.data?.data ?? [];
  const expiring = expiringQuery.data?.data ?? [];

  const daysLeft = (d: string | null) => {
    if (!d) return null;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000);
  };

  return (
    <div className="enterprise-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div style={{ minWidth: 0 }}>
            <div className="enterprise-kicker">
              <span className="enterprise-id">CMS</span>
              <span className="badge status-active">Contract Management</span>
            </div>
            <h1 className="enterprise-title">Contract Management</h1>
            <p className="enterprise-subtitle">
              Track the full contract lifecycle — from request and legal review through
              approval, execution and renewal — across every department.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 260 }}>
            <form onSubmit={submitSearch} className="cm-search" style={{ maxWidth: 'none' }}>
              <Search />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contracts…"
                aria-label="Search contracts"
              />
            </form>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/contracts/list" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <LayoutGrid size={14} /> Browse all
              </Link>
              <Link href="/contracts/new" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                <Plus size={14} /> New contract
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="enterprise-kpi-grid cols-6">
        {kpis.map((k) => (
          <Link key={k.title} href={k.href} className={`enterprise-kpi tone-${k.tone}`} style={{ textDecoration: 'none' }}>
            <div className="enterprise-kpi-head">
              <div style={{ minWidth: 0 }}>
                <div className="enterprise-kpi-label">{k.title}</div>
                <div className="enterprise-kpi-number">{k.value.toLocaleString()}</div>
              </div>
              <div className={`enterprise-kpi-icon tone-${k.tone}`}>{k.icon}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div className="enterprise-layout">
        <div className="enterprise-main">

          {/* Pipeline distribution */}
          <div className="enterprise-panel">
            <div className="enterprise-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div className="enterprise-panel-title"><Activity /> Pipeline by Stage</div>
              <Link href="/reports" className="btn btn-ghost btn-sm">
                Reports <ArrowUpRight size={13} />
              </Link>
            </div>
            <div className="enterprise-panel-body">
              {pipelineTotal === 0 ? (
                <PanelEmpty icon={<Inbox size={20} />} message="No contracts in the pipeline yet." />
              ) : (
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipeline} margin={{ top: 6, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ fill: 'var(--bg-card-hover)' }} content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Contracts" radius={[6, 6, 0, 0]} maxBarSize={52}>
                        {pipeline.map((p, i) => <Cell key={i} fill={p.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Activity feed — real audit trail */}
          {canReadAudit && (
            <div className="enterprise-panel">
              <div className="enterprise-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div className="enterprise-panel-title"><Activity /> Recent Contract Activity</div>
                <Link href="/admin/audit" className="btn btn-ghost btn-sm">
                  Full audit trail <ArrowUpRight size={13} />
                </Link>
              </div>
              <div className="enterprise-panel-body">
                {activityQuery.isLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="skeleton" style={{ height: 46, borderRadius: 8 }} />
                    ))}
                  </div>
                ) : activityQuery.isError ? (
                  <PanelEmpty icon={<ShieldAlert size={20} />} message="Activity log unavailable." />
                ) : activity.length === 0 ? (
                  <PanelEmpty icon={<Inbox size={20} />} message="No contract activity recorded yet." />
                ) : (
                  <div className="cm-feed">
                    {activity.map((a) => (
                      <div key={a.id} className="cm-feed-item">
                        <div className="cm-feed-dot"><FileSignature /></div>
                        <div className="cm-feed-body">
                          <div className="cm-feed-action">{categoryLabel(a.action)}</div>
                          <div className="cm-feed-meta">
                            {a.details ? `${a.details} · ` : ''}{a.user} ·{' '}
                            {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div className="enterprise-side">

          {/* Expiry alerts — real EXPIRING_SOON contracts */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><ShieldAlert /> Expiry Alerts</div>
            {expiringQuery.isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />
                ))}
              </div>
            ) : expiring.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 8, padding: '22px 8px', color: 'var(--success)', textAlign: 'center',
              }}>
                <CheckCircle size={34} style={{ opacity: 0.55 }} />
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>No contracts expiring soon.</span>
              </div>
            ) : (
              <>
                {expiring.map((c) => {
                  const d = daysLeft(c.expiryDate);
                  return (
                    <Link key={c.id} href={`/contracts/${c.id}`} className="cm-alert-row" style={{ textDecoration: 'none' }}>
                      <div style={{ minWidth: 0 }}>
                        <div className="cm-alert-title">{c.title}</div>
                        <div className="cm-alert-sub">
                          {c.contractNumber} · {c.counterparty}
                        </div>
                        <div className="cm-alert-sub" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Calendar size={11} />
                          {c.expiryDate ? format(new Date(c.expiryDate), 'MMM d, yyyy') : 'No expiry date'}
                        </div>
                      </div>
                      {d !== null && (
                        <span className="badge status-expiring-soon" style={{ flexShrink: 0 }}>
                          {d < 0 ? 'Overdue' : d === 0 ? 'Today' : `${d}d`}
                        </span>
                      )}
                    </Link>
                  );
                })}
                <Link href="/contracts/expiring" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                  Manage expiring contracts <ArrowRight size={13} />
                </Link>
              </>
            )}
          </div>

          {/* Category mix — real groupBy from stats */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><PieIcon /> Contracts by Category</div>
            {categories.length === 0 ? (
              <PanelEmpty icon={<Inbox size={20} />} message="No categories to show." />
            ) : (
              <>
                <div style={{ height: 168, marginBottom: 10 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={76}
                        paddingAngle={3}
                        stroke="var(--surface)"
                        strokeWidth={2}
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
                        {categoryLabel(c.category)}
                      </span>
                      <span className="cm-legend-count">{c.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Quick links */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><LayoutGrid /> Quick Access</div>
            <div className="enterprise-detail-list">
              {[
                { label: 'My contracts', href: '/contracts/my' },
                { label: 'Assigned to me', href: '/contracts/assigned' },
                { label: 'Awaiting review', href: '/contracts/review' },
                { label: 'Awaiting approval', href: '/contracts/approval' },
                { label: 'Executed', href: '/contracts/executed' },
                { label: 'Archive', href: '/contracts/archive' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="enterprise-detail-row"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <span className="enterprise-detail-label">{l.label}</span>
                  <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Statuses excluded from the pipeline chart, surfaced honestly */}
      {(num('expired') > 0 || num('archived') > 0) && (
        <div className="enterprise-actionbar">
          <div className="enterprise-actionbar-left">
            <span className="enterprise-actionbar-title">Closed out</span>
            <span className="badge status-expired">{num('expired')} expired</span>
            <span className="badge status-terminated">{num('archived')} terminated</span>
          </div>
          <div className="enterprise-actionbar-actions">
            <Link href="/contracts/archive" className="btn btn-ghost btn-sm">
              View archive <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
