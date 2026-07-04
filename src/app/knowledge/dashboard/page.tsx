'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Plus, FileEdit, Search, FolderTree as FolderTreeIcon, Upload, Eye,
  Download, Clock, CheckCircle2, TrendingUp,
} from 'lucide-react';
import { StatusBadge } from '@/components/knowledge/StatusBadge';
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

export default function KnowledgeDashboardPage() {
  const { data: currentUser } = useCurrentUser();

  const { data: stats, isLoading } = useQuery({
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

  if (isLoading || !stats) {
    return <div className="text-center py-20"><div className="spinner-sm border-accent" /></div>;
  }

  const s = stats.summary;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Knowledge Repository Dashboard</h1>
          <p className="text-muted text-sm">Overview of the legal knowledge base, activity, and pending approvals.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/knowledge/search" className="btn btn-secondary"><Search size={16} /> Search Repository</Link>
          <Link href="/knowledge" className="btn btn-secondary"><FolderTreeIcon size={16} /> Browse Categories</Link>
          <Link href="/knowledge/templates" className="btn btn-secondary"><FileEdit size={16} /> Create Template</Link>
          <Link href="/knowledge/new" className="btn btn-primary"><Upload size={16} /> Upload Document</Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card accent"><div className="text-2xl font-bold">{s.total}</div><div className="text-xs text-muted mt-1">Total Knowledge Items</div></div>
        <div className="stat-card info"><div className="text-2xl font-bold">{s.contractTemplates}</div><div className="text-xs text-muted mt-1">Contract Templates</div></div>
        <div className="stat-card info"><div className="text-2xl font-bold">{s.legalOpinionTemplates}</div><div className="text-xs text-muted mt-1">Legal Opinion Templates</div></div>
        <div className="stat-card accent"><div className="text-2xl font-bold">{s.legalOpinions}</div><div className="text-xs text-muted mt-1">Legal Opinions</div></div>
        <div className="stat-card success"><div className="text-2xl font-bold">{s.policies}</div><div className="text-xs text-muted mt-1">Policies</div></div>
        <div className="stat-card warning"><div className="text-2xl font-bold">{s.nbeDirectives}</div><div className="text-xs text-muted mt-1">NBE Directives</div></div>
        <div className="stat-card warning"><div className="text-2xl font-bold">{s.lawsRegulations}</div><div className="text-xs text-muted mt-1">Laws &amp; Regulations</div></div>
        <div className="stat-card gold"><div className="text-2xl font-bold">{s.researchPapers}</div><div className="text-xs text-muted mt-1">Research Papers</div></div>
        <div className="stat-card gold"><div className="text-2xl font-bold">{s.articles}</div><div className="text-xs text-muted mt-1">Articles</div></div>
        <div className="stat-card success"><div className="text-2xl font-bold">{s.faqs}</div><div className="text-xs text-muted mt-1">FAQs</div></div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Category Distribution</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.categoryDistribution} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--accent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Downloads by Category</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.downloadsByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="downloads" fill="var(--info)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Knowledge Growth &amp; Monthly Uploads</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.monthlyUploads}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="var(--gold)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="card">
          <div className="card-header"><span className="card-title"><Upload size={15} className="inline mr-2" />Recent Uploads</span></div>
          {stats.recentlyAdded.length === 0 ? (
            <div className="empty-state"><p>No documents uploaded yet.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.recentlyAdded.map((d) => (
                <Link key={d.id} href={`/knowledge/${d.id}`} className="flex justify-between items-center text-sm p-2 rounded-md hover-card border border-transparent">
                  <span className="truncate">{d.documentNumber} — {d.title}</span>
                  <StatusBadge status={d.status as never} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title"><TrendingUp size={15} className="inline mr-2" />Popular Documents</span></div>
          {stats.popularDocuments.length === 0 ? (
            <div className="empty-state"><p>No bookmarked documents yet.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.popularDocuments.map((d) => (
                <Link key={d.id} href={`/knowledge/${d.id}`} className="flex justify-between items-center text-sm p-2 rounded-md hover-card border border-transparent">
                  <span className="truncate">{d.documentNumber} — {d.title}</span>
                  <span className="text-xs text-muted">{d.bookmarkCount} bookmarks</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title"><Eye size={15} className="inline mr-2" />Recently Viewed</span></div>
          {!recentlyViewed || recentlyViewed.length === 0 ? (
            <div className="empty-state"><p>You haven&apos;t viewed any documents recently.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentlyViewed.map((d) => (
                <Link key={d.id} href={`/knowledge/${d.id}`} className="flex justify-between items-center text-sm p-2 rounded-md hover-card border border-transparent">
                  <span className="truncate">{d.documentNumber} — {d.title}</span>
                  <StatusBadge status={d.status as never} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title"><CheckCircle2 size={15} className="inline mr-2" />Pending Approvals</span></div>
          {stats.pendingApprovals.length === 0 ? (
            <div className="empty-state"><p>Nothing pending review or approval.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.pendingApprovals.map((d) => (
                <Link key={d.id} href={`/knowledge/${d.id}`} className="flex justify-between items-center text-sm p-2 rounded-md hover-card border border-transparent">
                  <span className="truncate">{d.documentNumber} — {d.title}</span>
                  <StatusBadge status={d.status as never} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title"><Download size={15} className="inline mr-2" />Most Downloaded</span></div>
          {stats.mostDownloaded.length === 0 ? (
            <div className="empty-state"><p>No downloads recorded yet.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.mostDownloaded.map((d) => (
                <Link key={d.id} href={`/knowledge/${d.id}`} className="flex justify-between items-center text-sm p-2 rounded-md hover-card border border-transparent">
                  <span className="truncate">{d.documentNumber} — {d.title}</span>
                  <span className="text-xs text-muted">{d.downloads} downloads</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title"><Clock size={15} className="inline mr-2" />Document Activity</span></div>
          {stats.recentHistory.length === 0 ? (
            <div className="empty-state"><p>No recent activity.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.recentHistory.map((h) => (
                <Link key={h.id} href={`/knowledge/${h.document.id}`} className="text-sm p-2 rounded-md hover-card border border-transparent">
                  <div className="truncate">{h.description}</div>
                  <div className="text-xs text-muted">{h.actor ? `${h.actor.firstName} ${h.actor.lastName}` : 'System'} · {format(new Date(h.createdAt), 'MMM d, HH:mm')}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
