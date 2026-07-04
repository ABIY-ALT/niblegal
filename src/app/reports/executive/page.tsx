'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, PieChart, Users, Clock, FileText, Gavel, AlertTriangle,
  Calendar, ArrowUpRight, ArrowDownRight, CheckCircle, XCircle
} from 'lucide-react';

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', UNDER_REVIEW: 'Under Review', PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved', EXECUTED: 'Executed', ACTIVE: 'Active',
  EXPIRING_SOON: 'Expiring Soon', EXPIRED: 'Expired', TERMINATED: 'Terminated', RENEWED: 'Renewed',
};
const ADVISORY_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', VALIDATED: 'Validated', ASSIGNED: 'Assigned',
  DRAFTING: 'Drafting', REVIEW: 'Review', RETURNED: 'Returned', PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved', DISPATCHED: 'Dispatched', CLOSED: 'Closed', ARCHIVED: 'Archived',
  REJECTED: 'Rejected', ESCALATED: 'Escalated',
};

function KPICard({ title, value, icon: Icon, trend, trendValue, color = 'bg-amber-100 text-amber-800' }: any) {
  return (
    <div className="card p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}><Icon size={24} /></div>
      </div>
    </div>
  );
}

function BarChart({ data, max, colors }: any) {
  return (
    <div className="space-y-3">
      {data.map((item: any, index: number) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-sm w-28 truncate">{item.label}</span>
          <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-500" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: colors[index % colors.length] }} />
          </div>
          <span className="text-sm font-semibold w-12 text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function PieChartComponent({ data, colors }: any) {
  const total = data.reduce((sum: number, item: any) => sum + item.value, 0) || 1;
  let currentAngle = 0;
  return (
    <div className="flex items-center gap-8">
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {data.map((item: any, index: number) => {
            const angle = (item.value / total) * 360;
            const startAngle = currentAngle;
            currentAngle += angle;
            const startX = 50 + 40 * Math.cos(((startAngle - 90) * Math.PI) / 180);
            const startY = 50 + 40 * Math.sin(((startAngle - 90) * Math.PI) / 180);
            const endX = 50 + 40 * Math.cos(((currentAngle - 90) * Math.PI) / 180);
            const endY = 50 + 40 * Math.sin(((currentAngle - 90) * Math.PI) / 180);
            const largeArcFlag = angle > 180 ? 1 : 0;
            return <path key={index} d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`} fill={colors[index % colors.length]} />;
          })}
        </svg>
      </div>
      <div className="space-y-2">
        {data.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="text-sm">{item.label}: {item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Summary {
  contracts: { total: number; active: number; pendingApproval: number; expiring: number; byStatus: Record<string, number> };
  advisory: { total: number; pending: number; overdue: number; slaCompliance: number; avgTurnaroundHours: number; byStatus: Record<string, number> };
  officers: { name: string; contracts: number; advisory: number }[];
}

export default function ExecutiveDashboard() {
  const [timeRange, setTimeRange] = useState('30d');
  const { data, isLoading } = useQuery<Summary>({
    queryKey: ['reports-summary'],
    queryFn: async () => (await (await fetch('/api/reports/summary')).json()).data,
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-bg-surface rounded-xl" />
        <div className="grid grid-cols-4 gap-6">{[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-bg-surface rounded-xl" />)}</div>
        <div className="h-72 bg-bg-surface rounded-xl" />
      </div>
    );
  }

  const c = data.contracts;
  const a = data.advisory;

  const contractPie = Object.entries(c.byStatus).map(([k, v]) => ({ label: CONTRACT_STATUS_LABELS[k] ?? k, value: v })).filter((i) => i.value > 0);
  const advisoryPie = Object.entries(a.byStatus).map(([k, v]) => ({ label: ADVISORY_STATUS_LABELS[k] ?? k, value: v })).filter((i) => i.value > 0);
  const officerProductivity = data.officers.map((o) => ({ label: o.name, value: o.contracts + o.advisory }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Executive Dashboard</h1>
          <p className="text-gray-500">Real-time insights into legal operations</p>
        </div>
        <select className="form-control w-40" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Contracts" value={c.total} icon={FileText} color="bg-blue-100 text-blue-800" />
        <KPICard title="Active Contracts" value={c.active} icon={CheckCircle} color="bg-green-100 text-green-800" />
        <KPICard title="Total Legal Requests" value={a.total} icon={Gavel} color="bg-purple-100 text-purple-800" />
        <KPICard title="SLA Compliance" value={`${a.slaCompliance}%`} icon={Clock}
          trend={a.slaCompliance >= 90 ? 'up' : 'down'} trendValue={`${a.avgTurnaroundHours}h avg turnaround`}
          color={a.slaCompliance >= 90 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Pending Approvals" value={c.pendingApproval} icon={AlertTriangle} color="bg-orange-100 text-orange-800" />
        <KPICard title="Expiring Contracts" value={c.expiring} icon={Calendar} color="bg-red-100 text-red-800" />
        <KPICard title="Pending Requests" value={a.pending} icon={FileText} color="bg-yellow-100 text-yellow-800" />
        <KPICard title="Overdue Requests" value={a.overdue} icon={XCircle} color="bg-red-100 text-red-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header"><div className="flex items-center gap-2"><Users size={18} /><span className="card-title">Officer Productivity</span></div></div>
            {officerProductivity.length > 0
              ? <BarChart data={officerProductivity} max={Math.max(...officerProductivity.map((o) => o.value), 1)} colors={['#B8860B', '#2E8B57', '#4682B4', '#CD853F']} />
              : <p className="text-muted text-sm">No assignments yet.</p>}
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header"><div className="flex items-center gap-2"><Clock size={18} /><span className="card-title">Advisory SLA</span></div></div>
            <div className="p-2 space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted">Compliance</span><strong>{a.slaCompliance}%</strong></div>
              <div className="flex justify-between"><span className="text-muted">Overdue</span><strong className="text-red-600">{a.overdue}</strong></div>
              <div className="flex justify-between"><span className="text-muted">Avg turnaround</span><strong>{a.avgTurnaroundHours}h</strong></div>
              <div className="flex justify-between"><span className="text-muted">Closed</span><strong>{a.total - a.pending}</strong></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header"><div className="flex items-center gap-2"><PieChart size={18} /><span className="card-title">Contracts by Status</span></div></div>
          {contractPie.length > 0 ? <PieChartComponent data={contractPie} colors={['#B8860B', '#2E8B57', '#4682B4', '#CD853F', '#FF6347', '#32CD32', '#FFD700', '#808080', '#DDA0DD']} /> : <p className="text-muted text-sm">No contracts yet.</p>}
        </div>
        <div className="card">
          <div className="card-header"><div className="flex items-center gap-2"><BarChart3 size={18} /><span className="card-title">Legal Requests by Status</span></div></div>
          {advisoryPie.length > 0 ? <PieChartComponent data={advisoryPie} colors={['#2E8B57', '#3CB371', '#90EE90', '#00FA9A', '#00CED1', '#20B2AA', '#5F9EA0', '#FF6347']} /> : <p className="text-muted text-sm">No requests yet.</p>}
        </div>
      </div>
    </div>
  );
}
