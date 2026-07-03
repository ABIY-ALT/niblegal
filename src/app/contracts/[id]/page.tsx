'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, FileText, Activity, History, Users, Paperclip, File, CheckCircle, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function ContractDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tab, setTab] = useState<'overview' | 'workflow' | 'versions' | 'attachments' | 'comments' | 'audit'>('overview');

  const { data: contract, isLoading, error } = useQuery({
    queryKey: ['contract', id],
    queryFn: async () => {
      const res = await fetch(`/api/contracts/${id}`);
      if (!res.ok) throw new Error('Failed to fetch contract');
      return res.json();
    }
  });

  if (isLoading) return <div className="text-center py-20"><div className="spinner-sm border-accent mx-auto" /></div>;
  if (error || !contract) return <div className="text-center py-20 text-danger font-semibold">Contract not found</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/contracts/list" className="btn btn-ghost btn-sm px-2"><ArrowLeft size={16} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm text-[var(--gold)]">{contract.contractNumber}</span>
            <span className={`badge status-${contract.status.toLowerCase().replace('_', '-')}`}>{contract.status}</span>
          </div>
          <h2 className="text-xl font-bold m-0">{contract.title}</h2>
          <p className="text-sm text-muted mt-1">{contract.counterparty} · {contract.category.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs border-b border-border flex gap-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: <FileText size={14} /> },
          { id: 'workflow', label: 'Workflow', icon: <Activity size={14} /> },
          { id: 'versions', label: 'Versions', count: contract.versions?.length, icon: <History size={14} /> },
          { id: 'attachments', label: 'Attachments', icon: <Paperclip size={14} /> },
          { id: 'comments', label: 'Comments', count: contract.comments?.length, icon: <Users size={14} /> },
          { id: 'audit', label: 'Audit Log', count: contract.auditLogs?.length, icon: <File size={14} /> }
        ].map(t => (
          <button 
            key={t.id} 
            className={`px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-2 ${tab === t.id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-[var(--text)]'}`}
            onClick={() => setTab(t.id as any)}
          >
            {t.icon} {t.label} {t.count !== undefined && <span className="bg-[var(--bg-input)] px-2 py-0.5 rounded-full text-xs">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card flex flex-col gap-4">
            <h3 className="font-semibold border-b border-border pb-2">Contract Information</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted">Category</div><div>{contract.category.replace(/_/g, ' ')}</div>
              <div className="text-muted">Vendor</div><div>{contract.counterparty}</div>
              <div className="text-muted">Department</div><div>{contract.requester?.department?.name || '—'}</div>
              <div className="text-muted">Requested By</div><div>{contract.requester?.firstName} {contract.requester?.lastName}</div>
            </div>
            
            <h3 className="font-semibold border-b border-border pb-2 mt-4">Description</h3>
            <p className="text-sm text-muted">{contract.description || 'No description provided.'}</p>
          </div>

          <div className="card flex flex-col gap-4">
            <h3 className="font-semibold border-b border-border pb-2">Financial & Dates</h3>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              <div className="text-muted">Value</div><div>{contract.value ? `${contract.value} ${contract.currency}` : '—'}</div>
              <div className="text-muted">Start Date</div><div>{contract.startDate ? format(new Date(contract.startDate), 'MMM d, yyyy') : '—'}</div>
              <div className="text-muted">Expiry Date</div><div>{contract.expiryDate ? format(new Date(contract.expiryDate), 'MMM d, yyyy') : '—'}</div>
              <div className="text-muted">Renewal Alert</div><div>{contract.renewalAlertDays} days</div>
              <div className="text-muted">Created At</div><div>{format(new Date(contract.createdAt), 'MMM d, yyyy HH:mm')}</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="card overflow-hidden">
          <h3 className="font-semibold border-b border-border pb-4 mb-4">Audit Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted border-b border-border">
                <tr>
                  <th className="py-2">Date</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {contract.auditLogs?.map((log: any) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="py-3 whitespace-nowrap">{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}</td>
                    <td>{log.user?.firstName} {log.user?.lastName}</td>
                    <td><span className="badge bg-[var(--bg-input)] text-xs">{log.action}</span></td>
                    <td className="text-muted">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Placeholders for other tabs to save space */}
      {['workflow', 'versions', 'attachments', 'comments'].includes(tab) && (
        <div className="card text-center py-20 text-muted">
          <p className="font-medium text-lg mb-2">This module is under construction</p>
          <p className="text-sm">The {tab} functionality will be connected to the API shortly.</p>
        </div>
      )}
    </div>
  );
}
