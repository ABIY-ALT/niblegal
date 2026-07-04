'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Plus, Search, BookOpen, FileText, UserCheck, FileEdit, Eye,
  Gavel, CheckCircle2, AlertTriangle, Clock, Users, TrendingUp,
} from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { PriorityBadge } from '@/components/advisory/PriorityBadge';

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

const PIE_COLORS = ['var(--success)', 'var(--danger)'];

export default function LegalAdvisoryDashboardPage() {
  const { data: currentUser } = useCurrentUser();

  const { data: stats, isLoading } = useQuery({
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

  if (isLoading || !stats) {
    return <div className="text-center py-20"><div className="spinner-sm border-accent" /></div>;
  }

  const s = stats.summary;
  const slaPieData = [
    { name: 'SLA Met', value: s.slaMet },
    { name: 'SLA Breached', value: s.slaBreached },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">Legal Advisory Help Desk</h1>
          <p className="text-muted text-sm">Overview of advisory requests, SLA performance, and team workload.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/advisory/list" className="btn btn-secondary"><Search size={16} /> Search Requests</Link>
          <Link href="/knowledge" className="btn btn-secondary"><BookOpen size={16} /> Knowledge Repository</Link>
          <Link href="/advisory/new" className="btn btn-primary"><Plus size={16} /> New Advisory Request</Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card accent"><div className="text-2xl font-bold">{s.total}</div><div className="text-xs text-muted mt-1">Total Requests</div></div>
        <div className="stat-card info"><div className="text-2xl font-bold">{s.newRequests}</div><div className="text-xs text-muted mt-1">New Requests</div></div>
        <div className="stat-card info"><div className="text-2xl font-bold">{s.assigned}</div><div className="text-xs text-muted mt-1">Assigned</div></div>
        <div className="stat-card accent"><div className="text-2xl font-bold">{s.drafting}</div><div className="text-xs text-muted mt-1">Draft Opinions</div></div>
        <div className="stat-card warning"><div className="text-2xl font-bold">{s.pendingReview}</div><div className="text-xs text-muted mt-1">Pending Review</div></div>
        <div className="stat-card warning"><div className="text-2xl font-bold">{s.pendingApproval}</div><div className="text-xs text-muted mt-1">Pending Approval</div></div>
        <div className="stat-card success"><div className="text-2xl font-bold">{s.closed}</div><div className="text-xs text-muted mt-1">Closed Requests</div></div>
        <div className="stat-card danger"><div className="text-2xl font-bold">{s.overdue}</div><div className="text-xs text-muted mt-1">Overdue Requests</div></div>
        <div className="stat-card success"><div className="text-2xl font-bold">{s.slaMet}</div><div className="text-xs text-muted mt-1">SLA Met</div></div>
        <div className="stat-card danger"><div className="text-2xl font-bold">{s.slaBreached}</div><div className="text-xs text-muted mt-1">SLA Breached</div></div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Requests by Department</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.byDepartment}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Requests by Category</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.byCategory} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--info)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">SLA Performance</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={slaPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {slaPieData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Monthly Advisory Requests</span></div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.monthlyTrends}>
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
          <div className="card-header">
            <span className="card-title"><UserCheck size={15} className="inline mr-2" />My Work Queue</span>
          </div>
          {!myQueue || myQueue.length === 0 ? (
            <div className="empty-state"><p>Nothing assigned to you right now.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {myQueue.map((r) => (
                <Link key={r.id} href={`/advisory/${r.id}`} className="flex justify-between items-center text-sm p-2 rounded-md hover-card border border-transparent">
                  <span className="truncate">{r.requestNumber} — {r.subject}</span>
                  <PriorityBadge priority={r.priority as never} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><AlertTriangle size={15} className="inline mr-2" />Critical Legal Requests</span>
          </div>
          {stats.criticalRequests.length === 0 ? (
            <div className="empty-state"><p>No critical or urgent requests open.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.criticalRequests.map((r) => (
                <Link key={r.id} href={`/advisory/${r.id}`} className="flex justify-between items-center text-sm p-2 rounded-md hover-card border border-transparent">
                  <span className="truncate">{r.requestNumber} — {r.subject}</span>
                  <PriorityBadge priority={r.priority as never} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><Clock size={15} className="inline mr-2" />Upcoming SLA Deadlines</span>
          </div>
          {stats.upcomingDeadlines.length === 0 ? (
            <div className="empty-state"><p>No open requests with an SLA deadline.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.upcomingDeadlines.map((r) => (
                <Link key={r.id} href={`/advisory/${r.id}`} className="flex justify-between items-center text-sm p-2 rounded-md hover-card border border-transparent">
                  <span className="truncate">{r.requestNumber} — {r.subject}</span>
                  <span className="text-xs text-muted">{format(new Date(r.slaDeadline), 'MMM d, HH:mm')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><TrendingUp size={15} className="inline mr-2" />Recent Activities</span>
          </div>
          {stats.recentHistory.length === 0 ? (
            <div className="empty-state"><p>No recent activity.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.recentHistory.map((h) => (
                <Link key={h.id} href={`/advisory/${h.legalRequest.id}`} className="text-sm p-2 rounded-md hover-card border border-transparent">
                  <div className="truncate">{h.description}</div>
                  <div className="text-xs text-muted">{h.actor ? `${h.actor.firstName} ${h.actor.lastName}` : 'System'} · {format(new Date(h.createdAt), 'MMM d, HH:mm')}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><Users size={15} className="inline mr-2" />Officer Workload</span>
          </div>
          {stats.officerWorkload.length === 0 ? (
            <div className="empty-state"><p>No active caseloads.</p></div>
          ) : (
            <div className="flex flex-col gap-2">
              {stats.officerWorkload.map((o) => (
                <div key={o.name} className="flex justify-between items-center text-sm p-2">
                  <span>{o.name}</span>
                  <span className="badge status-active">{o.count} active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title"><FileText size={15} className="inline mr-2" />Department Statistics</span>
          </div>
          <div className="flex flex-col gap-2">
            {stats.byDepartment.map((d) => (
              <div key={d.name} className="flex justify-between items-center text-sm p-2">
                <span>{d.name}</span>
                <span className="badge status-active">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Quick Access</span></div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/advisory/assigned" className="btn btn-secondary btn-sm"><FileEdit size={14} /> Assigned Requests</Link>
          <Link href="/advisory/review" className="btn btn-secondary btn-sm"><Eye size={14} /> Pending Review</Link>
          <Link href="/advisory/approval" className="btn btn-secondary btn-sm"><Gavel size={14} /> Pending Approval</Link>
          <Link href="/advisory/dispatched" className="btn btn-secondary btn-sm"><CheckCircle2 size={14} /> Dispatched</Link>
        </div>
      </div>
    </div>
  );
}
