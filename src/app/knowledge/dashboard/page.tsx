'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Plus, Search, FolderTree as FolderTreeIcon, Upload, Eye, Download, Clock,
  CheckCircle2, TrendingUp, BookOpen, FileText, Inbox, Bookmark, ArrowRight,
  Activity, RefreshCw, LayoutGrid,
} from 'lucide-react';
import { StatusBadge } from '@/components/knowledge/StatusBadge';
import { ChartTooltip } from '@/components/ChartTooltip';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface DocRef {
  id: string;
  documentNumber: string;
  title: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  downloads?: number;
}

interface StatsResponse {
  summary: {
    total: number;
    contractTemplates: number;
    legalOpinionTemplates: number;
    legalOpinions: number;
    policies: number;
    nbeDirectives: number;
    lawsRegulations: number;
    researchPapers: number;
    articles: number;
    faqs: number;
  };
  recentlyAdded: DocRef[];
  recentlyUpdated: DocRef[];
  mostDownloaded: DocRef[];
  pendingApprovals: DocRef[];
  categoryDistribution: { name: string; count: number }[];
  downloadsByCategory: { name: string; downloads: number }[];
  monthlyUploads: { month: string; count: number }[];
  recentHistory: { id: string; description: string; createdAt: string; actor: { firstName: string; lastName: string } | null; document: { id: string; documentNumber: string } }[];
  popularDocuments: (DocRef & { bookmarkCount: number })[];
}

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

/** Compact document row used across the sidebar panels. */
function DocRow({ doc, trailing }: { doc: DocRef; trailing?: React.ReactNode }) {
  return (
    <Link href={`/knowledge/${doc.id}`} className="cm-feed-item" style={{ textDecoration: 'none', alignItems: 'center' }}>
      <div className="cm-feed-body">
        <div className="cm-feed-action" style={{ fontSize: 12.5 }}>{doc.title}</div>
        <div className="cm-feed-meta">{doc.documentNumber}</div>
      </div>
      {trailing ?? <StatusBadge status={doc.status as never} />}
    </Link>
  );
}

export default function KnowledgeDashboardPage() {
  const { data: currentUser } = useCurrentUser();

  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: async () => {
      const res = await fetch('/api/knowledge/stats');
      if (!res.ok) throw new Error('Failed to load stats');
      return res.json() as Promise<StatsResponse>;
    },
  });

  const { data: recentlyViewed } = useQuery({
    queryKey: ['knowledge-recently-viewed', currentUser?.id],
    queryFn: async () => {
      const res = await fetch('/api/knowledge/documents/recently-viewed');
      const json = await res.json();
      return json.data as DocRef[];
    },
    enabled: !!currentUser?.id,
  });

  if (isLoading) {
    return (
      <div className="enterprise-page">
        <div className="skeleton" style={{ height: 118, borderRadius: 'var(--radius-lg)' }} />
        <div className="enterprise-kpi-grid cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
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

  if (isError || !stats) {
    return (
      <div className="enterprise-page">
        <div className="alert alert-danger">
          Could not load repository statistics.
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 10 }} onClick={() => refetch()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const s = stats.summary;

  const kpis = [
    { title: 'Total Items', value: s.total, icon: <BookOpen size={19} />, tone: 'accent', href: '/knowledge/list' },
    { title: 'Templates', value: s.contractTemplates + s.legalOpinionTemplates, icon: <FileText size={19} />, tone: 'info', href: '/knowledge/templates' },
    { title: 'Policies', value: s.policies, icon: <CheckCircle2 size={19} />, tone: 'success', href: '/knowledge/policies' },
    { title: 'Regulations', value: s.nbeDirectives + s.lawsRegulations, icon: <FolderTreeIcon size={19} />, tone: 'warning', href: '/knowledge/regulations' },
    { title: 'Research', value: s.researchPapers + s.articles, icon: <TrendingUp size={19} />, tone: 'muted', href: '/knowledge/research' },
  ];

  return (
    <div className="enterprise-page">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div style={{ minWidth: 0 }}>
            <div className="enterprise-kicker">
              <span className="enterprise-id">KNOWLEDGE</span>
              <span className="badge status-active">Dashboard</span>
            </div>
            <h1 className="enterprise-title">Knowledge Repository Dashboard</h1>
            <p className="enterprise-subtitle">
              Coverage of the legal knowledge base, contribution activity, download
              demand and documents awaiting approval.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/knowledge/search" className="btn btn-ghost btn-sm"><Search size={14} /> Search</Link>
            <Link href="/knowledge" className="btn btn-ghost btn-sm"><FolderTreeIcon size={14} /> Browse</Link>
            <Link href="/knowledge/new" className="btn btn-primary btn-sm"><Upload size={14} /> Upload</Link>
          </div>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="enterprise-kpi-grid cols-5">
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

      {/* ── Composition strip ────────────────────────────────────────────── */}
      <div className="enterprise-actionbar">
        <div className="enterprise-actionbar-left">
          <span className="enterprise-actionbar-title">Breakdown</span>
          <span className="badge status-draft">{s.legalOpinions} opinions</span>
          <span className="badge status-draft">{s.nbeDirectives} NBE directives</span>
          <span className="badge status-draft">{s.lawsRegulations} laws</span>
          <span className="badge status-draft">{s.articles} articles</span>
          <span className="badge status-draft">{s.faqs} FAQs</span>
        </div>
        <div className="enterprise-actionbar-actions">
          <Link href="/knowledge/list" className="btn btn-ghost btn-sm">
            Full list <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── Main / side ──────────────────────────────────────────────────── */}
      <div className="enterprise-layout">
        <div className="enterprise-main">

          {/* Monthly uploads */}
          <div className="enterprise-panel">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><TrendingUp /> Monthly Uploads</div>
            </div>
            <div className="enterprise-panel-body">
              {stats.monthlyUploads.length === 0 ? (
                <PanelEmpty message="Not enough history to plot a trend." />
              ) : (
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.monthlyUploads} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltip />} />
                      <Line
                        type="monotone" dataKey="count" name="Uploads"
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

          {/* Category distribution */}
          <div className="enterprise-panel">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><LayoutGrid /> Category Distribution</div>
            </div>
            <div className="enterprise-panel-body">
              {stats.categoryDistribution.length === 0 ? (
                <PanelEmpty message="No categorised documents yet." />
              ) : (
                <div style={{ height: Math.max(200, stats.categoryDistribution.length * 30 + 40) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.categoryDistribution} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <YAxis type="category" dataKey="name" width={150} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ fill: 'var(--bg-card-hover)' }} content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Documents" fill="var(--primary)" radius={[0, 6, 6, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Downloads by category */}
          <div className="enterprise-panel">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><Download /> Downloads by Category</div>
            </div>
            <div className="enterprise-panel-body">
              {stats.downloadsByCategory.length === 0 ? (
                <PanelEmpty message="No downloads recorded yet." />
              ) : (
                <div style={{ height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.downloadsByCategory} margin={{ top: 6, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="name" interval={0} angle={-22} textAnchor="end" height={60}
                        axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                      />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fontSize: 11.5, fill: 'var(--text-muted)' }} />
                      <Tooltip cursor={{ fill: 'var(--bg-card-hover)' }} content={<ChartTooltip />} />
                      <Bar dataKey="downloads" name="Downloads" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={44} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="enterprise-panel">
            <div className="enterprise-panel-header">
              <div className="enterprise-panel-title"><Activity /> Document Activity</div>
            </div>
            <div className="enterprise-panel-body">
              {stats.recentHistory.length === 0 ? (
                <PanelEmpty message="No recent document activity." />
              ) : (
                <div className="cm-feed">
                  {stats.recentHistory.map((h) => (
                    <Link key={h.id} href={`/knowledge/${h.document.id}`} className="cm-feed-item" style={{ textDecoration: 'none' }}>
                      <div className="cm-feed-dot"><FileText /></div>
                      <div className="cm-feed-body">
                        <div className="cm-feed-action">{h.description}</div>
                        <div className="cm-feed-meta">
                          {h.document.documentNumber} ·{' '}
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

          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><CheckCircle2 /> Pending Approvals</div>
            {stats.pendingApprovals.length === 0 ? (
              <PanelEmpty message="Nothing pending review or approval." />
            ) : (
              <div className="cm-feed">
                {stats.pendingApprovals.map((d) => <DocRow key={d.id} doc={d} />)}
              </div>
            )}
          </div>

          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><Upload /> Recent Uploads</div>
            {stats.recentlyAdded.length === 0 ? (
              <PanelEmpty message="No documents uploaded yet." />
            ) : (
              <div className="cm-feed">
                {stats.recentlyAdded.map((d) => <DocRow key={d.id} doc={d} />)}
              </div>
            )}
          </div>

          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><Eye /> Recently Viewed</div>
            {!recentlyViewed || recentlyViewed.length === 0 ? (
              <PanelEmpty message="You haven't viewed any documents recently." />
            ) : (
              <div className="cm-feed">
                {recentlyViewed.map((d) => <DocRow key={d.id} doc={d} />)}
              </div>
            )}
          </div>

          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><Bookmark /> Most Bookmarked</div>
            {stats.popularDocuments.length === 0 ? (
              <PanelEmpty message="No bookmarked documents yet." />
            ) : (
              <div className="cm-feed">
                {stats.popularDocuments.map((d) => (
                  <DocRow
                    key={d.id}
                    doc={d}
                    trailing={
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {d.bookmarkCount} saved
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><Download /> Most Downloaded</div>
            {stats.mostDownloaded.length === 0 ? (
              <PanelEmpty message="No downloads recorded yet." />
            ) : (
              <div className="cm-feed">
                {stats.mostDownloaded.map((d) => (
                  <DocRow
                    key={d.id}
                    doc={d}
                    trailing={
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {d.downloads ?? 0} ↓
                      </span>
                    }
                  />
                ))}
              </div>
            )}
          </div>

          <div className="enterprise-side-card">
            <div className="enterprise-side-title"><Clock /> Quick Access</div>
            <div className="enterprise-detail-list">
              {[
                { label: 'Template library', href: '/knowledge/templates' },
                { label: 'Clause library', href: '/knowledge/clauses' },
                { label: 'Policies', href: '/knowledge/policies' },
                { label: 'Regulations', href: '/knowledge/regulations' },
                { label: 'Research & articles', href: '/knowledge/research' },
                { label: 'My favorites', href: '/knowledge/favorites' },
                { label: 'Archive', href: '/knowledge/archive' },
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
