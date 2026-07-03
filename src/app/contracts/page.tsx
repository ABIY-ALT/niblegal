'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  FileText, Clock, CheckCircle, ShieldAlert, Plus, 
  ArrowRight, FileSignature, Archive
} from 'lucide-react';

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
    return <div className="p-10 text-center"><div className="spinner-sm border-accent"></div></div>;
  }

  const s = stats?.summary || {};

  const statCards = [
    { title: 'Total Contracts', value: s.total || 0, icon: <FileText />, color: 'accent' },
    { title: 'Drafts', value: s.draft || 0, icon: <FileText />, color: '' },
    { title: 'Under Review', value: s.review || 0, icon: <Clock />, color: 'warning' },
    { title: 'Pending Approval', value: (s.managerApproval || 0) + (s.directorApproval || 0), icon: <CheckCircle />, color: 'info' },
    { title: 'Executed', value: s.executed || 0, icon: <FileSignature />, color: 'success' },
    { title: 'Expiring Soon', value: s.expiring || 0, icon: <ShieldAlert />, color: 'danger' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold mb-1">Contract Management</h1>
          <p className="text-muted text-sm">Dashboard overview of all contract activities.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/contracts/list" className="btn btn-secondary">
            View All Contracts
          </Link>
          <Link href="/contracts/new" className="btn btn-primary">
            <Plus size={16} /> New Contract
          </Link>
        </div>
      </div>

      <div className="stat-grid">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`stat-card ${stat.color}`}>
            <div className="flex items-center justify-between">
              <div className="stat-label">{stat.title}</div>
              <div className="stat-icon" style={{ background: `var(--bg-input)` }}>{stat.icon}</div>
            </div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="section-header">
            <div className="section-title">Recent Activity</div>
            <Link href="/contracts/list" className="btn btn-ghost btn-sm">View All <ArrowRight size={14} /></Link>
          </div>
          <div className="text-muted text-sm text-center py-10">
            Activity feed component will go here.
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card">
            <div className="section-title mb-4">Contracts by Category</div>
            <div className="flex flex-col gap-3">
              {stats?.categories?.map((cat: any) => (
                <div key={cat.category} className="flex justify-between items-center p-2 bg-[var(--bg-input)] rounded-md">
                  <span className="text-sm font-medium">{cat.category.replace('_', ' ')}</span>
                  <span className="badge bg-[var(--accent-glow)] text-accent">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-input)] border-[var(--danger)]">
            <div className="section-title mb-2 text-danger"><ShieldAlert /> Expiry Alerts</div>
            <p className="text-sm text-muted mb-4">You have {s.expiring || 0} contracts expiring in the next 30 days.</p>
            <Link href="/contracts/expiring" className="btn btn-danger w-full justify-center">Manage Renewals</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
