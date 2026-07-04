'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  FileText, Clock, CheckCircle, ShieldAlert, Plus, 
  ArrowRight, FileSignature, Archive, Search, Filter, ArrowUpRight, TrendingUp, Activity
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const PIE_COLORS = ['var(--success)', 'var(--warning)', 'var(--info)', 'var(--danger)'];

const RECENT_ACTIVITY = [
  { id: 1, action: 'Contract Approved', contract: 'CON-2026-00142', user: 'Director Gen.', time: '2 mins ago', color: 'text-success' },
  { id: 2, action: 'Draft Created', contract: 'CON-2026-00145', user: 'Abebe T.', time: '1 hour ago', color: 'text-info' },
  { id: 3, action: 'Review Requested', contract: 'CON-2026-00139', user: 'Mekdes A.', time: '3 hours ago', color: 'text-warning' },
  { id: 4, action: 'Signature Pending', contract: 'CON-2026-00120', user: 'System', time: '5 hours ago', color: 'text-accent' },
];

const MONTHLY_TRENDS = [
  { month: 'Jan', count: 40 }, { month: 'Feb', count: 30 }, { month: 'Mar', count: 45 },
  { month: 'Apr', count: 50 }, { month: 'May', count: 65 }, { month: 'Jun', count: 85 }
];

export default function ContractsDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['contracts-stats'],
    queryFn: async () => {
      const res = await fetch('/api/contracts/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-20 bg-bg-surface rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-bg-surface rounded-xl"></div>)}
        </div>
        <div className="h-96 bg-bg-surface rounded-xl"></div>
      </div>
    );
  }

  const s = stats?.summary || { total: 0, draft: 0, review: 0, pendingApproval: 0, approved: 0, executed: 0, active: 0, expiring: 0, expired: 0 };
  const categories = stats?.categories || [
    { category: 'Procurement', count: 40 },
    { category: 'HR', count: 20 },
    { category: 'IT_Services', count: 35 },
    { category: 'Real_Estate', count: 29 }
  ];

  const statCards = [
    { title: 'Total Contracts', value: s.total, icon: <FileText size={20} />, color: 'accent' },
    { title: 'Drafts', value: s.draft, icon: <FileText size={20} />, color: 'info' },
    { title: 'Under Review', value: s.review, icon: <Clock size={20} />, color: 'warning' },
    { title: 'Pending Approval', value: s.pendingApproval, icon: <CheckCircle size={20} />, color: 'info' },
    { title: 'Executed', value: s.executed, icon: <FileSignature size={20} />, color: 'success' },
    { title: 'Expiring Soon', value: s.expiring, icon: <ShieldAlert size={20} />, color: 'danger' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in">
      
      {/* ── Header & Toolbar ── */}
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-3 text-primary">
            <FileSignature size={24} className="text-accent" /> Contract Management
          </h1>
          <p className="text-sm text-muted mt-1">Enterprise dashboard for tracking contract lifecycles and compliance.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search contracts..." className="form-control pl-9 w-64" />
          </div>
          <button className="btn btn-secondary"><Filter size={16} /> Filters</button>
          <Link href="/contracts/new" className="btn btn-primary">
            <Plus size={16} /> Create Contract
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`card card-sm border-t-4 border-t-${stat.color} hover:-translate-y-1 transition-transform`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-muted text-[11px] font-bold uppercase tracking-wider">{stat.title}</div>
              <div className={`text-${stat.color} bg-${stat.color}/10 p-1.5 rounded-lg`}>{stat.icon}</div>
            </div>
            <div className="text-3xl font-bold font-mono text-primary">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* ── Main Dashboard Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart: Volume over time */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <h3 className="font-bold flex items-center gap-2"><TrendingUp size={16} className="text-accent"/> Monthly Processing Volume</h3>
            <button className="btn btn-ghost btn-sm text-xs">View Report <ArrowUpRight size={12}/></button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_TRENDS}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-card)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown by Category */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <h3 className="font-bold flex items-center gap-2"><Activity size={16} className="text-info"/> Contracts by Category</h3>
          </div>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {categories.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2">
            {categories.map((cat: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-bg-surface rounded-md transition-colors">
                <span className="flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                  {cat.category.replace('_', ' ')}
                </span>
                <span className="font-mono text-muted">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <h3 className="font-bold flex items-center gap-2"><Activity size={16} className="text-success"/> Real-Time Activity Feed</h3>
            <Link href="/contracts/list" className="btn btn-ghost btn-sm text-xs">View All Logs <ArrowUpRight size={12}/></Link>
          </div>
          <div className="flex flex-col relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {RECENT_ACTIVITY.map((activity, i) => (
              <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active py-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-bg-card bg-bg-surface text-muted shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                  <div className={`w-2 h-2 rounded-full bg-current ${activity.color}`}></div>
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-bg-surface shadow-sm">
                  <div className="flex justify-between mb-1">
                    <span className={`font-bold text-sm ${activity.color}`}>{activity.action}</span>
                    <span className="text-xs text-muted font-mono">{activity.time}</span>
                  </div>
                  <div className="text-sm">
                    Contract <Link href={`/contracts/${activity.contract}`} className="text-accent hover:underline font-mono">{activity.contract}</Link> by <strong>{activity.user}</strong>.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="card border-danger/30 bg-danger/5">
          <div className="flex items-center justify-between border-b border-danger/10 pb-4 mb-4">
            <h3 className="font-bold flex items-center gap-2 text-danger"><ShieldAlert size={16}/> Expiry & Compliance Alerts</h3>
          </div>
          {s.expiring > 0 ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-danger-hover">
                <strong>Attention Required:</strong> You have {s.expiring} contracts expiring in the next 30 days that require immediate renewal assessment.
              </p>
              <div className="bg-bg-card border border-danger/20 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs font-bold">CON-2026-00084</span>
                  <span className="badge bg-danger/10 text-danger text-[10px]">3 Days Left</span>
                </div>
                <div className="text-sm font-medium mb-1">Microsoft Azure Enterprise Agreement</div>
                <div className="text-xs text-muted">Vendor: Microsoft Corp.</div>
              </div>
              <div className="bg-bg-card border border-danger/20 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs font-bold">CON-2026-00091</span>
                  <span className="badge bg-danger/10 text-danger text-[10px]">12 Days Left</span>
                </div>
                <div className="text-sm font-medium mb-1">Cisco Network Maintenance</div>
                <div className="text-xs text-muted">Vendor: Cisco Systems</div>
              </div>
              <Link href="/contracts/expiring" className="btn btn-danger w-full justify-center mt-2">Manage Expiring Contracts</Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-success">
              <CheckCircle size={48} className="opacity-50 mb-3" />
              <p className="text-sm font-medium">All contracts are up to date.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
