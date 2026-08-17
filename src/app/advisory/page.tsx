'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Plus, Search, BookOpen, FileText, UserCheck, FileEdit, Eye,
  Gavel, CheckCircle2, AlertTriangle, Clock, Users, TrendingUp,
  Inbox, Building2, LayoutGrid, ArrowRight, ShieldCheck, Send,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PriorityBadge } from '@/components/advisory/PriorityBadge';
import { ChartTooltip } from '@/components/ChartTooltip';

interface StatsResponse {
  summary: {
    total: number;
    newRequests: number;
    assigned: number;
    drafting: number;
    pendingReview: number;
    pendingApproval: number;
    closed: number;
    overdue: number;
    slaMet: number;
    slaBreached: number;
  };
  byDepartment: { name: string; count: number }[];
  byCategory: { name: string; count: number }[];
  monthlyTrends: { month: string; count: number }[];
  criticalRequests: { id: string; requestNumber: string; subject: string; priority: string; slaDeadline: string; status: string }[];
  upcomingDeadlines: { id: string; requestNumber: string; subject: string; slaDeadline: string; status: string }[];
  recentHistory: { id: string; description: string; createdAt: string; actor: { firstName: string; lastName: string } | null; legalRequest: { id: string; requestNumber: string } }[];
  officerWorkload: { name: string; count: number }[];
}

const SLA_COLORS = ['#16a34a', '#ef4444'];
const CATEGORY_COLOR = '#3b82f6';

function PanelEmpty({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 9, padding: '26px 14px', textAlign: 'center', color: 'var(--text-muted)',
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

/** Compact row used by the sidebar queues. */
function QueueRow({ href, primary, secondary, trailing }: {
  href: string; primary: string; secondary?: string; trailing?: React.ReactNode;
}) {
  return (
    <Link href={href} className="cm-feed-item" style={{ textDecoration: 'none', alignItems: 'center' }}>
      <div className="cm-feed-body">
        <div className="cm-feed-action" style={{ fontSize: 12.5 }}>{primary}</div>
        {secondary && <div className="cm-feed-meta">{secondary}</div>}
      </div>
      {trailing}
    </Link>
  );
}

export default function LegalAdvisoryDashboardPage() {
  const { data: currentUser } = useCurrentUser();

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['advisory-stats'],
    queryFn: async () => {
      const res = await fetch('/api/advisory/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json() as Promise<StatsResponse>;
    },
  });

  const { data: myQueue } = useQuery({
    queryKey: ['advisory-my-queue', currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/advisory/requests?assigneeId=${currentUser?.id}&excludeClosed=1&limit=5`);
      const json = await res.json();
      return json.data as { id: string; requestNumber: string; subject: string; status: string; priority: string }[];
    },
    enabled: !!currentUser?.id,
  });

  if (isLoading) {
    return (
      <div className="enterprise-page">
        <div className="skeleton" style={{ height: 118, borderRadius: 'var(--radius-lg)' }} />
        <div className="enterprise-kpi-grid cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 104, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        <div className="enterprise-layout">
          <div className="skeleton" style={{ height: 360, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 360, borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="enterprise-page">
        <div className="alert alert-danger">
          Could not load advisory statistics.
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 10 }} onClick={() => refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  const s = stats.summary;
  const slaTotal = s.slaMet + s.slaBreached;
  const slaCompliance = slaTotal > 0 ? Math.round((s.slaMet / slaTotal) * 100) : null;
  const slaPieData = [
    { name: 'SLA Met', value: s.slaMet },
    { name: 'SLA Breached', value: s.slaBreached },
  ];

  const kpis = [
    { title: 'Total Requests', value: s.total, icon: <FileText size={19} />, tone: 'accent', href: '/advisory/list' },
    { title: 'New', value: s.newRequests, icon: <Inbox size={19} />, tone: 'info', href: '/advisory/list' },
    { title: 'Assigned', value: s.assigned, icon: <UserCheck size={19} />, tone: 'info', href: '/advisory/assigned' },
    { title: 'Drafting', value: s.drafting, icon: <FileEdit size={19} />, tone: 'muted', href: '/advisory/drafts' },
    { title: 'Pending Review', value: s.pendingReview, icon: <Eye size={19} />, tone: 'warning', href: '/advisory/review' },
    { title: 'Pending Approval', value: s.pendingApproval, icon: <Gavel size={19} />, tone: 'warning', href: '/advisory/approval' },
  ];

  return (
    <div className="enterprise-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div style={{ minWidth: 0 }}>
            <div className="enterprise-kicker">
              <span className="enterprise-id">LAHD</span>
              <span className="badge status-active">Legal Advisory</span>
            </div>
            <h1 className="enterprise-title">Legal Advisory Help Desk</h1>
            <p className="enterprise-subtitle">
              Advisory request intake, officer assignment, opinion drafting and SLA
              performance across every requesting department.
            </p>
          </div>

          {/* SLA compliance card */}
          <div className="enterprise-sla-card">
            <div className="enterprise-sla-label">
              <span>SLA Compliance</span>
              <ShieldCheck size={13} />
            </div>
            {slaCompliance === null ? (
              <div style={{ fontSize: 12.5, opacity: 0.7 }}>No closed requests to measure yet.</div>
            ) : (
              <>
                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 30, fontWeight: 800, lineHeight: 1 }}>
                  {slaCompliance}%
                </div>
                <div style={{
                  height: 6, borderRadius: 20, marginTop: 10, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.18)',
                }}>
                  <div style={{
                    width: `${slaCompliance}%`, height: '100%', borderRadius: 20,
                    background: slaCompliance >= 80 ? '#4ADE80' : slaCompliance >= 50 ? '#FACC15' : '#F87171',
                  }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 11.5, opacity: 0.72 }}>
                  {s.slaMet} met · {s.slaBreached} breached
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Primary KPIs ─────────────────────────────────────────────────── */}
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

      {/* ── Outcome strip ────────────────────────────────────────────────── */}
      <div className="enterprise-actionbar">
        <div className="enterprise-actionbar-left">
          <span className="enterprise-actionbar-title">Outcomes</span>
          <span className="badge status-approved">{s.closed} closed</span>
          <span className="badge status-active">{s.slaMet} SLA met</span>
          {s.overdue > 0 && <span className="badge status-expired">{s.overdue} overdue</span>}
          {s.slaBreached > 0 && <span className="badge status-expired">{s.slaBreached} SLA breached</span>}
        </div>
        <div className="enterprise-actionbar-actions">
          <Link href="/advisory/new" className="btn btn-primary btn-sm"><Plus size={14} /> New request</Link>
          <Link href="/advisory/list" className="btn btn-ghost btn-sm"><Search size={14} /> Search</Link>
          <Link href="/knowledge" className="btn btn-ghost btn-sm"><BookOpen size={14} /> Knowledge</Link>
        </div>
      </div>

      {/* ── Main / side ──────────────────────────────────────────────────── */}
      <div className="enterprise-layout">
        <div className="enterprise-main">

          {/* Monthly trend */}
          <div className="enterprise-panel">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><TrendingUp /> Monthly Advisory Volume</div>
            </div>
            <div className="enterprise-panel-body">
              {stats.monthlyTrends.length === 0 ? (
                <PanelEmpty message="Not enough history to plot a trend." />
              ) : (
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.monthlyTrends} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltip />} />
                      <Line
                        type="monotone" dataKey="count" name="Requests"
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

          {/* Department + category */}
          <div className="enterprise-panel">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><Building2 /> Requests by Department</div>
            </div>
            <div className="enterprise-panel-body">
              {stats.byDepartment.length === 0 ? (
                <PanelEmpty message="No departmental requests recorded." />
              ) : (
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byDepartment} margin={{ top: 6, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="name" interval={0} angle={-22} textAnchor="end" height={60}
                        axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                      />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ fill: 'var(--bg-card-hover)' }} content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Requests" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={46} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="enterprise-panel">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><LayoutGrid /> Requests by Category</div>
            </div>
            <div className="enterprise-panel-body">
              {stats.byCategory.length === 0 ? (
                <PanelEmpty message="No categorised requests yet." />
              ) : (
                <div style={{ height: Math.max(200, stats.byCategory.length * 34 + 40) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byCategory} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <YAxis
                        type="category" dataKey="name" width={140}
                        axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                      />
                      <Tooltip cursor={{ fill: 'var(--bg-card-hover)' }} content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Requests" fill={CATEGORY_COLOR} radius={[0, 6, 6, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="enterprise-panel">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><TrendingUp /> Recent Activity</div>
            </div>
            <div className="enterprise-panel-body">
              {stats.recentHistory.length === 0 ? (
                <PanelEmpty message="No recent advisory activity." />
              ) : (
                <div className="cm-feed">
                  {stats.recentHistory.map((h) => (
                    <Link key={h.id} href={`/advisory/${h.legalRequest.id}`} className="cm-feed-item" style={{ textDecoration: 'none' }}>
                      <div className="cm-feed-dot"><Send /></div>
                      <div className="cm-feed-body">
                        <div className="cm-feed-action">{h.description}</div>
                        <div className="cm-feed-meta">
                          {h.legalRequest.requestNumber} ·{' '}
                          {h.actor ? `${h.actor.firstName} ${h.actor.lastName}` : 'System'} ·{' '}
                          {format(new Date(h.createdAt), 'MMM d, HH:mm')}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────────────── */}
        <div className="enterprise-side">

          {/* My queue */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><UserCheck /> My Work Queue</div>
            {!myQueue || myQueue.length === 0 ? (
              <PanelEmpty message="Nothing assigned to you right now." />
            ) : (
              <div className="cm-feed">
                {myQueue.map((r) => (
                  <QueueRow
                    key={r.id}
                    href={`/advisory/${r.id}`}
                    primary={r.subject}
                    secondary={r.requestNumber}
                    trailing={<PriorityBadge priority={r.priority as never} />}
                  />
                ))}
                <Link href="/advisory/assigned" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}>
                  View all assigned <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>

          {/* Critical */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><AlertTriangle /> Critical Requests</div>
            {stats.criticalRequests.length === 0 ? (
              <PanelEmpty message="No critical or urgent requests open." />
            ) : (
              <div className="cm-feed">
                {stats.criticalRequests.map((r) => (
                  <QueueRow
                    key={r.id}
                    href={`/advisory/${r.id}`}
                    primary={r.subject}
                    secondary={r.requestNumber}
                    trailing={<PriorityBadge priority={r.priority as never} />}
                  />
                ))}
              </div>
            )}
          </div>

          {/* SLA deadlines */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><Clock /> Upcoming SLA Deadlines</div>
            {stats.upcomingDeadlines.length === 0 ? (
              <PanelEmpty message="No open requests with an SLA deadline." />
            ) : (
              <div className="cm-feed">
                {stats.upcomingDeadlines.map((r) => (
                  <QueueRow
                    key={r.id}
                    href={`/advisory/${r.id}`}
                    primary={r.subject}
                    secondary={r.requestNumber}
                    trailing={
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {format(new Date(r.slaDeadline), 'MMM d, HH:mm')}
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* SLA donut */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><ShieldCheck /> SLA Performance</div>
            {slaTotal === 0 ? (
              <PanelEmpty message="No SLA outcomes recorded yet." />
            ) : (
              <>
                <div style={{ height: 160 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={slaPieData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3}
                        stroke="var(--surface)" strokeWidth={2}
                      >
                        {slaPieData.map((entry, i) => <Cell key={entry.name} fill={SLA_COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="cm-legend">
                  {slaPieData.map((d, i) => (
                    <div key={d.name} className="cm-legend-row">
                      <span className="cm-legend-name">
                        <span className="cm-legend-swatch" style={{ background: SLA_COLORS[i] }} />
                        {d.name}
                      </span>
                      <span className="cm-legend-count">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Officer workload */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><Users /> Officer Workload</div>
            {stats.officerWorkload.length === 0 ? (
              <PanelEmpty message="No active caseloads." />
            ) : (
              <div className="enterprise-detail-list">
                {stats.officerWorkload.map((o) => (
                  <div key={o.name} className="enterprise-detail-row">
                    <span className="enterprise-detail-label">{o.name}</span>
                    <span className="enterprise-detail-value">{o.count} active</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick access */}
          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><LayoutGrid /> Quick Access</div>
            <div className="enterprise-detail-list">
              {[
                { label: 'My requests', href: '/advisory/my', icon: <FileText size={13} /> },
                { label: 'Assigned to me', href: '/advisory/assigned', icon: <FileEdit size={13} /> },
                { label: 'Pending review', href: '/advisory/review', icon: <Eye size={13} /> },
                { label: 'Pending approval', href: '/advisory/approval', icon: <Gavel size={13} /> },
                { label: 'Dispatched', href: '/advisory/dispatched', icon: <CheckCircle2 size={13} /> },
                { label: 'Closed', href: '/advisory/closed', icon: <CheckCircle2 size={13} /> },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="enterprise-detail-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="enterprise-detail-label" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {l.icon}{l.label}
                  </span>
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
