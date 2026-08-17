'use client';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { formatDate, timeAgo } from '@/utils/formatters';
import {
  FileText, Scale, AlertTriangle, CheckCircle, Clock, Users,
  BarChart3, Activity, Zap, Bell, Search, Plus,
  FolderSearch, Calendar, ChevronRight, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, AreaChart, Area, Legend,
} from 'recharts';

// ─── Themed Recharts tooltip ───────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '10px 14px', boxShadow: 'var(--shadow-md)',
      fontSize: 12,
    }}>
      {label && <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', marginTop: i ? 3 : 0 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color || p.fill, display: 'inline-block' }} />
          <span style={{ flex: 1 }}>{p.name}</span>
          <strong style={{ color: 'var(--text-primary)' }}>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

/* "Contracts by category" is a single measure, so every bar takes slot 1 —
   painting each category its own hue double-encodes bar length as colour and
   implies categories that have no relationship to each other. Identity here is
   carried by the axis label. */
const SERIES_1 = 'var(--chart-1)';
const SERIES_2 = 'var(--chart-2)';
const titleCase = (s: string) => s.replace(/_/g, ' ').replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());

const NON_TERMINAL_CONTRACT = ['ACTIVE', 'EXECUTED', 'EXPIRED', 'TERMINATED'];
const TERMINAL_ADVISORY = ['CLOSED', 'ARCHIVED', 'DISPATCHED', 'REJECTED'];

// ─── UI Components ─────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
          <Tooltip cursor={{ fill: 'var(--bg-card-hover)' }} content={<ChartTooltip />} />
          <Bar dataKey="value" name="Contracts" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color }: { label: string; value: number | string; sub?: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="stat-card" style={{
      position: 'relative', overflow: 'hidden', background: 'var(--bg-card)',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
    </div>
  );
}

/* Placeholders so in-flight aggregates read as "loading" rather than as a
   confident zero / "No data". */
function StatCardSkeleton() {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 20,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ width: '50%', height: 30 }} />
        <div className="skeleton" style={{ width: '75%', height: 14 }} />
        <div className="skeleton" style={{ width: '60%', height: 12 }} />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div style={{ width: '100%', height: 200, display: 'flex', alignItems: 'flex-end', gap: 12, padding: '8px 0' }}>
      {[62, 88, 45, 74, 55, 92].map((h, i) => (
        <div key={i} className="skeleton" style={{ flex: 1, height: `${h}%`, borderRadius: '6px 6px 0 0' }} />
      ))}
    </div>
  );
}

function QuickActionBtn({ icon, label, href, primary = false }: { icon: React.ReactNode, label: string, href: string, primary?: boolean }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 16px',
        background: primary ? 'var(--primary)' : 'var(--bg-card)',
        color: primary ? '#3B2718' : 'var(--text-primary)',
        border: primary ? 'none' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'center',
        boxShadow: primary ? '0 8px 16px var(--accent-glow)' : '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'all 0.2s', height: '100%', justifyContent: 'center'
      }} className="hover:scale-105">
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: primary ? 'rgba(255,255,255,0.2)' : 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      </div>
    </Link>
  );
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const userQuery = useCurrentUser();
  const currentUser = userQuery.data;
  const role = currentUser?.role;
  const isManager = role === 'manager';
  const isPrivileged = !!role && role !== 'requesting_organ';
  const now = new Date();

  // Org-wide aggregates (manager / legal_officer / admin_assistant only)
  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await fetchJson('/api/reports/summary')).data,
    enabled: isPrivileged,
  });
  const auditQuery = useQuery({
    queryKey: ['dashboard-audit'],
    queryFn: async () => (await fetchJson('/api/reports/audit?limit=6')).data,
    enabled: isPrivileged,
  });
  const advisoryDeadlinesQuery = useQuery({
    queryKey: ['dashboard-advisory-deadlines'],
    queryFn: () => fetchJson('/api/advisory/stats'),
    enabled: isPrivileged,
  });
  const expiringContractsQuery = useQuery({
    queryKey: ['dashboard-expiring-contracts'],
    queryFn: async () => (await fetchJson('/api/contracts?status=EXPIRING_SOON&limit=5')).data,
    enabled: isPrivileged,
  });

  // Personal work items (legal_officer sees their assigned items; requesting_organ sees their own submissions)
  const officerContractsQuery = useQuery({
    queryKey: ['dashboard-officer-contracts'],
    queryFn: async () => (await fetchJson('/api/contracts?scope=assigned&limit=100')).data,
    enabled: role === 'legal_officer',
  });
  const officerAdvisoryQuery = useQuery({
    queryKey: ['dashboard-officer-advisory', currentUser?.id],
    queryFn: async () => (await fetchJson(`/api/advisory/requests?assigneeId=${currentUser!.id}&limit=100`)).data,
    enabled: role === 'legal_officer' && !!currentUser,
  });
  const myContractsQuery = useQuery({
    queryKey: ['dashboard-my-contracts'],
    queryFn: async () => (await fetchJson('/api/contracts?scope=mine&limit=100')).data,
    enabled: role === 'requesting_organ',
  });
  const myAdvisoryQuery = useQuery({
    queryKey: ['dashboard-my-advisory', currentUser?.id],
    queryFn: async () => (await fetchJson(`/api/advisory/requests?requesterId=${currentUser!.id}&limit=100`)).data,
    enabled: role === 'requesting_organ' && !!currentUser,
  });

  const notificationsQuery = useQuery({
    queryKey: ['dashboard-notifications'],
    queryFn: () => fetchJson('/api/notifications?limit=5'),
    enabled: !!currentUser,
  });

  if (!currentUser) {
    if (userQuery.isError) {
      return (
        <div className="empty-state">
          <p>Your session has expired. <Link href="/login">Sign in again</Link>.</p>
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const summary = summaryQuery.data as {
    contracts: { total: number; active: number; draft: number; underReview: number; pendingApproval: number; expiring: number; totalValue: number; byCategory: { category: string; count: number }[] };
    advisory: { total: number; pending: number; overdue: number; breached: number; byStatus: Record<string, number> };
    officers: { id: string; name: string; contracts: number; advisory: number }[];
    trends: { month: string; contracts: number; advisory: number; knowledge: number }[];
  } | undefined;

  const personalContracts: any[] = role === 'legal_officer' ? (officerContractsQuery.data ?? []) : role === 'requesting_organ' ? (myContractsQuery.data ?? []) : [];
  const personalAdvisory: any[] = role === 'legal_officer' ? (officerAdvisoryQuery.data ?? []) : role === 'requesting_organ' ? (myAdvisoryQuery.data ?? []) : [];

  const draftsCount = isManager || role === 'admin_assistant'
    ? (summary?.contracts.draft ?? 0)
    : personalContracts.filter((c) => c.status === 'DRAFT').length;
  const myPendingReviews = isManager || role === 'admin_assistant'
    ? (summary?.contracts.underReview ?? 0)
    : personalContracts.filter((c) => c.status === 'UNDER_REVIEW').length;
  const myPendingApprovals = isManager
    ? (summary?.contracts.pendingApproval ?? 0) + (summary?.advisory.byStatus?.PENDING_APPROVAL ?? 0)
    : 0;
  const overdueCount = isManager || role === 'admin_assistant'
    ? (summary?.advisory.overdue ?? 0)
    : personalContracts.filter((c) => c.slaDeadline && new Date(c.slaDeadline) < now && !NON_TERMINAL_CONTRACT.includes(c.status)).length +
      personalAdvisory.filter((r) => r.slaDeadline && new Date(r.slaDeadline) < now && !TERMINAL_ADVISORY.includes(r.status)).length;

  const pendingApprovals = (summary?.contracts.pendingApproval ?? 0) + (summary?.advisory.byStatus?.PENDING_APPROVAL ?? 0);
  const slaBreached = summary?.advisory.breached ?? 0;

  const contractsByCategory = (summary?.contracts.byCategory ?? []).map((c) => ({
    label: titleCase(c.category).split(' ')[0],
    value: c.count,
    color: SERIES_1,
  }));

  const monthlyData = (summary?.trends ?? []).map((t) => ({ month: t.month, Contracts: t.contracts, Advisory: t.advisory }));

  const officers = summary?.officers ?? [];

  // Upcoming deadlines
  type Deadline = { id: string; title: string; date: string; type: string; color: string };
  let upcomingDeadlines: Deadline[] = [];
  if (isPrivileged) {
    const contractDeadlines: Deadline[] = (expiringContractsQuery.data ?? []).map((c: any) => ({
      id: c.id, title: c.title, date: c.expiryDate, type: 'Expiry', color: 'var(--warning)',
    }));
    const advisoryDeadlines: Deadline[] = (advisoryDeadlinesQuery.data?.upcomingDeadlines ?? [])
      .filter((r: any) => !TERMINAL_ADVISORY.includes(r.status))
      .map((r: any) => ({ id: r.id, title: r.subject, date: r.slaDeadline, type: 'SLA Due', color: 'var(--danger)' }));
    upcomingDeadlines = [...contractDeadlines, ...advisoryDeadlines]
      .filter((d) => d.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  } else {
    const contractDeadlines: Deadline[] = personalContracts
      .filter((c) => c.status === 'EXPIRING_SOON' && c.expiryDate)
      .map((c) => ({ id: c.id, title: c.title, date: c.expiryDate, type: 'Expiry', color: 'var(--warning)' }));
    const advisoryDeadlines: Deadline[] = personalAdvisory
      .filter((r) => r.slaDeadline && !TERMINAL_ADVISORY.includes(r.status))
      .map((r) => ({ id: r.id, title: r.subject, date: r.slaDeadline, type: 'SLA Due', color: 'var(--danger)' }));
    upcomingDeadlines = [...contractDeadlines, ...advisoryDeadlines]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }

  // Recent activity
  type ActivityRow = { id: string; module: string; action: string; userName: string; details: string; timestamp: string };
  const recentActivity: ActivityRow[] = isPrivileged
    ? (auditQuery.data ?? []).map((a: any) => ({ id: a.id, module: a.module, action: a.action.toLowerCase(), userName: a.user, details: a.details, timestamp: a.createdAt }))
    : [
        ...personalContracts.map((c) => ({ id: c.id, module: 'CMS', action: 'updated', userName: currentUser.name, details: c.title, timestamp: c.updatedAt ?? c.createdAt })),
        ...personalAdvisory.map((r) => ({ id: r.id, module: 'LAHD', action: 'updated', userName: currentUser.name, details: r.subject, timestamp: r.updatedAt ?? r.createdAt })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);

  const notifications: { id: string; title: string; body: string; priority: string; createdAt: string }[] = notificationsQuery.data?.notifications ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

      {/* ── Top Bar: Global Search & Welcome ──────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap', background: 'var(--bg-card)', padding: '20px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ minWidth: 0, flex: '1 1 260px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Welcome back, {currentUser.name.split(' ')[0]}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Here is what's happening in your legal operations today.</p>
        </div>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400, minWidth: 0 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="search"
            aria-label="Search contracts, requests, officers and keywords"
            placeholder="Search contracts, requests, officers, keywords..."
            style={{
              width: '100%', padding: '12px 16px 12px 42px', borderRadius: 30,
              border: '1px solid var(--border)', background: 'var(--bg-body)',
              fontSize: 14, color: 'var(--text-primary)', outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* ── Alert Banner ──────────────────────────────────────────────────── */}
      {isPrivileged && ((summary?.contracts.expiring ?? 0) > 0 || (summary?.advisory.breached ?? 0) > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(summary?.contracts.expiring ?? 0) > 0 && (
            <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
              <AlertTriangle size={18} /><strong>{summary?.contracts.expiring} contract(s)</strong>&nbsp;expiring soon — renewal action required.
            </div>
          )}
          {(summary?.advisory.breached ?? 0) > 0 && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
              <Zap size={18} /><strong>{summary?.advisory.breached} advisory</strong>&nbsp;request(s) have breached their SLA deadline.
            </div>
          )}
        </div>
      )}

      <div className="dash-layout">

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Quick Actions */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="var(--accent)" /> Quick Actions
            </h2>
            <div className="grid-quick">
              <QuickActionBtn icon={<Plus size={24} />} label="New Contract" href="/contracts/new" primary />
              <QuickActionBtn icon={<Scale size={24} />} label="New Legal Advice" href="/advisory/new" />
              {/* "Upload Contract" pointed at /repository/upload, which does not
                  exist — it 404'd and duplicated "Search Repository" below.
                  Re-add it once an upload route exists. */}
              <QuickActionBtn icon={<FolderSearch size={24} />} label="Search Repository" href="/repository" />
            </div>
          </div>

          {/* KPI Cards */}
          {isPrivileged ? (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={16} color="var(--accent)" /> Key Performance Indicators
              </h2>
              {summaryQuery.isLoading ? (
                <div className="grid-kpi">
                  {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
                </div>
              ) : summaryQuery.isError ? (
                <div className="alert alert-danger" style={{ marginBottom: 0 }}>
                  <AlertTriangle size={18} />
                  <span>Could not load performance indicators. <button type="button" className="btn btn-sm btn-ghost" style={{ marginLeft: 8 }} onClick={() => summaryQuery.refetch()}>Retry</button></span>
                </div>
              ) : (
                <div className="grid-kpi">
                  <StatCard label="Total Contracts" value={summary?.contracts.total ?? 0} sub="All time repository" icon={<FileText size={20} />} color="#EAB308" />
                  <StatCard label="Active Contracts" value={summary?.contracts.active ?? 0} sub="Currently in force" icon={<CheckCircle size={20} />} color="#10b981" />
                  <StatCard label="Pending Approvals" value={pendingApprovals} sub="Awaiting manager sign-off" icon={<Clock size={20} />} color="#f59e0b" />
                  <StatCard label="SLA Breached" value={slaBreached} sub="Advisory overdue tasks" icon={<AlertTriangle size={20} />} color="#ef4444" />
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={16} color="var(--accent)" /> My Overview
              </h2>
              <div className="grid-kpi">
                <StatCard label="My Contracts" value={personalContracts.length} sub="Submitted by you / your department" icon={<FileText size={20} />} color="#EAB308" />
                <StatCard label="My Requests" value={personalAdvisory.length} sub="Advisory requests you filed" icon={<Scale size={20} />} color="#10b981" />
                <StatCard label="Drafts" value={draftsCount} sub="Not yet submitted" icon={<Clock size={20} />} color="#f59e0b" />
                <StatCard label="Overdue" value={overdueCount} sub="Past SLA deadline" icon={<AlertTriangle size={20} />} color="#ef4444" />
              </div>
            </div>
          )}

          {/* Charts Section */}
          {isPrivileged && (
            <div className="grid-charts">
              {/* Contracts by Category */}
              <div className="card" style={{ padding: 24 }}>
                <div className="card-header" style={{ marginBottom: 20 }}><span className="card-title" style={{ fontSize: 16 }}>Contracts by Category</span></div>
                {summaryQuery.isLoading
                  ? <ChartSkeleton />
                  : contractsByCategory.length > 0
                    ? <BarChart data={contractsByCategory} />
                    : <div className="empty-state" style={{ padding: '56px 20px' }}><p>No category data yet.</p></div>}
              </div>

              {/* Monthly Legal Activities */}
              <div className="card" style={{ padding: 24 }}>
                <div className="card-header" style={{ marginBottom: 20 }}><span className="card-title" style={{ fontSize: 16 }}>Monthly Legal Activities</span></div>
                {summaryQuery.isLoading ? <ChartSkeleton /> : monthlyData.length === 0 ? (
                  <div className="empty-state" style={{ padding: '56px 20px' }}><p>No activity recorded yet.</p></div>
                ) : (
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradContracts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SERIES_1} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={SERIES_1} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradAdvisory" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={SERIES_2} stopOpacity={0.24} />
                          <stop offset="100%" stopColor={SERIES_2} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} width={40} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }} />
                      <Area type="monotone" dataKey="Contracts" stroke={SERIES_1} strokeWidth={2} fill="url(#gradContracts)" dot={false} activeDot={{ r: 4.5, strokeWidth: 2, stroke: 'var(--surface)' }} />
                      <Area type="monotone" dataKey="Advisory" stroke={SERIES_2} strokeWidth={2} fill="url(#gradAdvisory)" dot={false} activeDot={{ r: 4.5, strokeWidth: 2, stroke: 'var(--surface)' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity Timeline */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-header" style={{ marginBottom: 20 }}>
              <span className="card-title" style={{ fontSize: 16 }}><Activity size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--accent)' }} />Recent Activity</span>
              {isPrivileged && <Link href="/reports/audit" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>Full Audit Trail <ChevronRight size={14} /></Link>}
            </div>
            {recentActivity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {recentActivity.map((entry, i) => (
                  <div key={entry.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                    {i !== recentActivity.length - 1 && <div style={{ position: 'absolute', left: 19, top: 40, bottom: -16, width: 2, background: 'var(--border)' }} />}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: entry.module === 'CMS' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, border: '2px solid var(--bg-card)' }}>
                      {entry.action === 'approved' ? <CheckCircle size={18} color="var(--success)" /> :
                       entry.action === 'submitted' ? <FileText size={18} color="var(--accent)" /> :
                       <Briefcase size={18} color="var(--text-muted)" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingBottom: i !== recentActivity.length - 1 ? 16 : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 14, color: 'var(--text-primary)', minWidth: 0, flex: '1 1 200px', overflowWrap: 'anywhere' }}>
                          <span style={{ fontWeight: 700 }}>{entry.userName}</span> {entry.action} — <span style={{ color: 'var(--text-secondary)' }}>{entry.details}</span>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(entry.timestamp)}</span>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <span className="badge" style={{ fontSize: 11, background: 'var(--bg-input)', color: 'var(--text-muted)' }}>{entry.module} Module</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><p>No recent activity yet.</p></div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* My Work Queue */}
          <div className="card" style={{ padding: 20, background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(234,179,8,0.04) 100%)', border: '1px solid rgba(234,179,8,0.25)' }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <span className="card-title" style={{ fontSize: 16, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={18} /> My Work Queue
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Drafts</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{draftsCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Reviews</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: myPendingReviews > 0 ? 'var(--info)' : 'var(--text-primary)' }}>{myPendingReviews}</span>
              </div>
              {isManager && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Approvals</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: myPendingApprovals > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>{myPendingApprovals}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: overdueCount > 0 ? 'rgba(239,68,68,0.1)' : 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: `1px solid ${overdueCount > 0 ? 'var(--danger)' : 'var(--border)'}` }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: overdueCount > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>Overdue Tasks</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: overdueCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{overdueCount}</span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="card" style={{ padding: 20 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <span className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={18} color="var(--warning)" /> Upcoming Deadlines</span>
            </div>
            {upcomingDeadlines.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingDeadlines.map((dl) => (
                  <div key={dl.id} style={{ padding: '12px', borderLeft: `3px solid ${dl.color}`, background: 'var(--bg-input)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dl.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: dl.color, fontWeight: 600 }}>{dl.type}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{formatDate(dl.date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No upcoming deadlines.</div>
            )}
          </div>

          {/* Notifications */}
          <div className="card" style={{ padding: 20 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <span className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={18} color="var(--info)" /> Notifications</span>
              <Link href="/notifications" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View All</Link>
            </div>
            {notifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notifications.map((n) => {
                  const critical = n.priority === 'CRITICAL' || n.priority === 'HIGH';
                  return (
                    <div key={n.id} style={{
                      padding: 12, borderRadius: 'var(--radius-sm)',
                      background: critical ? 'rgba(239,68,68,0.05)' : 'var(--bg-input)',
                      border: critical ? '1px solid rgba(239,68,68,0.2)' : '1px solid transparent',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, minWidth: 0, overflowWrap: 'anywhere', color: critical ? 'var(--danger)' : 'var(--text-primary)' }}>{n.title}</div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflowWrap: 'anywhere' }}>{n.body}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notifications.</div>
            )}
          </div>

          {/* Officer Workload (For Managers) */}
          {isManager && (
            <div className="card" style={{ padding: 20 }}>
              <div className="card-header" style={{ marginBottom: 16 }}>
                <span className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} color="var(--accent)" /> Officer Workload</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {officers.map((officer) => {
                  const total = officer.contracts + officer.advisory;
                  const maxLoad = 8;
                  const pct = Math.min((total / maxLoad) * 100, 100);
                  const loadColor = pct > 75 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--success)';
                  return (
                    <div key={officer.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{officer.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{officer.contracts} CMS · {officer.advisory} LAHD</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: loadColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
