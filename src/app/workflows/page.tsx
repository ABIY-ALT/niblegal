'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Activity, Plus, Search, Filter, GitMerge, FileText, CheckCircle, Clock, MoreVertical, Play, Settings } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { currentUser } from '@/data/store';
import AccessDenied from '@/components/AccessDenied';

export default function WorkflowDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const isAdmin = currentUser.role === 'manager' || currentUser.role === 'admin_assistant';

  const { data, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await fetch('/api/workflows');
      if (!res.ok) throw new Error('Failed to fetch workflows');
      return res.json();
    }
  });

  const workflows = data?.workflows || [];
  
  const activeCount = workflows.filter((w: any) => w.status === 'PUBLISHED').length;
  const draftCount = workflows.filter((w: any) => w.status === 'DRAFT').length;

  if (!isAdmin) return <AccessDenied />;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-3">
            <GitMerge size={24} className="text-accent" /> Workflow Engine
          </h1>
          <p className="text-sm text-muted mt-1">Visually design, configure, and monitor automated business processes.</p>
        </div>
        <button className="btn btn-primary" onClick={() => alert('Create Modal Placeholder')}>
          <Plus size={16} /> Create Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card card-sm relative overflow-hidden border-t-4 border-t-accent">
          <div className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Total Workflows</div>
          <div className="text-3xl font-bold font-mono">{workflows.length}</div>
        </div>
        <div className="card card-sm relative overflow-hidden border-t-4 border-t-success">
          <div className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Active / Published</div>
          <div className="text-3xl font-bold font-mono">{activeCount}</div>
        </div>
        <div className="card card-sm relative overflow-hidden border-t-4 border-t-warning">
          <div className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Drafts</div>
          <div className="text-3xl font-bold font-mono">{draftCount}</div>
        </div>
        <div className="card card-sm relative overflow-hidden border-t-4 border-t-info">
          <div className="text-muted text-xs font-bold uppercase tracking-wider mb-1">Running Instances</div>
          <div className="text-3xl font-bold font-mono">14</div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between bg-bg-surface">
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search workflows..." 
              className="form-control pl-9 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-ghost btn-sm"><Filter size={14} /> Filter</button>
        </div>

        {isLoading ? (
          <div className="p-20 text-center text-muted">Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="p-20 text-center text-muted flex flex-col items-center gap-3">
            <GitMerge size={48} className="opacity-20" />
            <p>No workflows configured yet.</p>
            <button className="btn btn-secondary mt-2">Create First Workflow</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-input text-muted text-xs uppercase tracking-wider font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Name & Module</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Version</th>
                  <th className="py-3 px-4">Last Modified</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workflows.map((w: any) => (
                  <tr key={w.id} className="hover:bg-card-hover transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/workflows/${w.id}`} className="font-semibold text-primary hover:text-accent flex items-center gap-2">
                        {w.name}
                      </Link>
                      <div className="text-xs text-muted mt-1">{w.module}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${w.status === 'PUBLISHED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      v{w.versions?.[0]?.versionNumber || 1}.0
                    </td>
                    <td className="py-3 px-4 text-muted text-xs flex items-center gap-1 mt-1">
                      <Clock size={12}/> {formatDistanceToNow(new Date(w.updatedAt))} ago
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/workflows/${w.id}`} className="btn btn-ghost btn-sm p-1.5"><Settings size={14}/></Link>
                        <button className="btn btn-ghost btn-sm p-1.5" title="View Instances"><Activity size={14}/></button>
                      </div>
                    </td>
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
