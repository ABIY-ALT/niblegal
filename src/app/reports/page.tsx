'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, FileText, Gavel, Clock, Users, ShieldAlert,
  BarChart3, Settings, Calendar, Download, Search, Filter, 
  ArrowUpRight, ArrowDownRight, ArrowRight, PieChart as PieChartIcon
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const PIE_COLORS = ['#EAB308', '#3B2718', '#16A34A', '#6C4A28', '#EF4444'];

const MONTHLY_DATA = [
  { month: 'Jan', contracts: 40, advisory: 24, compliance: 98 },
  { month: 'Feb', contracts: 30, advisory: 28, compliance: 95 },
  { month: 'Mar', contracts: 45, advisory: 32, compliance: 96 },
  { month: 'Apr', contracts: 50, advisory: 36, compliance: 99 },
  { month: 'May', contracts: 65, advisory: 42, compliance: 92 },
  { month: 'Jun', contracts: 85, advisory: 50, compliance: 97 }
];

const SLA_DATA = [
  { department: 'HR', met: 94, breached: 6 },
  { department: 'IT', met: 88, breached: 12 },
  { department: 'Finance', met: 98, breached: 2 },
  { department: 'Operations', met: 82, breached: 18 },
  { department: 'Procurement', met: 91, breached: 9 }
];

export default function ReportsHub() {
  const [timeRange, setTimeRange] = useState('6m');

  const statCards = [
    { title: 'Total Volume', value: '1,284', trend: '+14%', isUp: true, icon: <TrendingUp size={20} />, color: 'accent' },
    { title: 'SLA Compliance', value: '94.2%', trend: '+2.1%', isUp: true, icon: <Clock size={20} />, color: 'success' },
    { title: 'Pending Reviews', value: '42', trend: '-5%', isUp: false, icon: <FileText size={20} />, color: 'warning' },
    { title: 'Risk Alerts', value: '7', trend: '+2', isUp: false, icon: <ShieldAlert size={20} />, color: 'danger' },
  ];

  const quickReports = [
    { title: 'Executive Summary', icon: <BarChart3 size={16}/>, href: '/reports/executive', color: 'text-accent bg-accent/10' },
    { title: 'Contract Analysis', icon: <FileText size={16}/>, href: '/reports/contracts', color: 'text-info bg-info/10' },
    { title: 'Advisory Performance', icon: <Gavel size={16}/>, href: '/reports/advisory', color: 'text-success bg-success/10' },
    { title: 'SLA Breaches', icon: <Clock size={16}/>, href: '/reports/sla', color: 'text-warning bg-warning/10' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-10">
      
      {/* ── Header ── */}
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border shadow-sm shrink-0">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-3 text-primary">
            <BarChart3 size={24} className="text-accent" /> Enterprise Analytics
          </h1>
          <p className="text-sm text-muted mt-1">Comprehensive reports, dashboards, and operational analytics.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex border border-border rounded-lg overflow-hidden bg-bg-input">
            <button className={`px-3 py-1.5 text-xs font-medium ${timeRange === '1m' ? 'bg-bg-surface shadow' : 'text-muted'}`} onClick={() => setTimeRange('1m')}>1M</button>
            <button className={`px-3 py-1.5 text-xs font-medium ${timeRange === '3m' ? 'bg-bg-surface shadow' : 'text-muted'}`} onClick={() => setTimeRange('3m')}>3M</button>
            <button className={`px-3 py-1.5 text-xs font-medium ${timeRange === '6m' ? 'bg-bg-surface shadow' : 'text-muted'}`} onClick={() => setTimeRange('6m')}>6M</button>
            <button className={`px-3 py-1.5 text-xs font-medium ${timeRange === '1y' ? 'bg-bg-surface shadow' : 'text-muted'}`} onClick={() => setTimeRange('1y')}>1Y</button>
          </div>
          <button className="btn btn-secondary"><Download size={16}/> Export Data</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {statCards.map((stat, idx) => (
          <div key={idx} className={`card card-sm border-t-4 border-t-${stat.color} hover:-translate-y-1 transition-transform`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-muted text-[11px] font-bold uppercase tracking-wider">{stat.title}</div>
              <div className={`text-${stat.color} bg-${stat.color}/10 p-1.5 rounded-lg`}>{stat.icon}</div>
            </div>
            <div className="flex items-end gap-3">
              <div className="text-3xl font-bold font-mono text-primary">{stat.value}</div>
              <div className={`flex items-center text-xs font-bold mb-1 ${stat.isUp ? (stat.color === 'danger' || stat.color === 'warning' ? 'text-danger' : 'text-success') : (stat.color === 'danger' || stat.color === 'warning' ? 'text-success' : 'text-danger')}`}>
                {stat.isUp ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                {stat.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Area Chart */}
        <div className="card lg:col-span-2 flex flex-col border border-border shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <h3 className="font-bold flex items-center gap-2"><TrendingUp size={16} className="text-accent"/> Workload Trajectory</h3>
            <div className="flex gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent"></div> Contracts</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gold"></div> Advisory</span>
            </div>
          </div>
          <div className="h-72 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorContracts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAdvisory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--gold)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="contracts" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorContracts)" />
                <Area type="monotone" dataKey="advisory" stroke="var(--gold)" strokeWidth={2} fillOpacity={1} fill="url(#colorAdvisory)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Reports & Actions */}
        <div className="flex flex-col gap-6">
          <div className="card border border-border shadow-sm">
            <h3 className="font-bold flex items-center gap-2 mb-4"><FileText size={16} className="text-primary"/> Quick Reports</h3>
            <div className="flex flex-col gap-2">
              {quickReports.map((report, i) => (
                <Link key={i} href={report.href} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-bg-surface transition-colors group">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${report.color}`}>
                    {report.icon}
                  </div>
                  <span className="font-medium text-sm flex-1 group-hover:text-primary transition-colors">{report.title}</span>
                  <ArrowRight size={14} className="text-muted group-hover:text-primary transition-colors group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
            <button className="btn btn-secondary w-full mt-4 justify-center"><Settings size={14}/> Report Builder</button>
          </div>

          <div className="card bg-gradient-to-br from-bg-card to-bg-surface border border-border shadow-sm flex-1 flex flex-col justify-center text-center p-6">
             <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3">
               <Calendar size={24} />
             </div>
             <h3 className="font-bold mb-1">Scheduled Exports</h3>
             <p className="text-xs text-muted mb-4">You have 2 automated reports scheduled for delivery this week.</p>
             <button className="btn btn-primary btn-sm mx-auto">Manage Schedule</button>
          </div>
        </div>

        {/* SLA Performance Bar Chart */}
        <div className="card lg:col-span-3 border border-border shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
            <h3 className="font-bold flex items-center gap-2"><Clock size={16} className="text-success"/> Departmental SLA Performance</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={SLA_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <Tooltip cursor={{ fill: 'var(--bg-input)' }} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)' }} />
                <Bar dataKey="met" name="SLA Met (%)" fill="var(--success)" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="breached" name="SLA Breached (%)" fill="var(--danger)" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}