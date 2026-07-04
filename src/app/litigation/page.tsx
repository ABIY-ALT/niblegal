'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Scale, Calendar, Users, TrendingUp, AlertTriangle, CheckCircle, 
  Search, Filter, Plus, FileText, ArrowUpRight, DollarSign,
  Gavel, ArrowRight, History
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const PIE_COLORS = ['#EAB308', '#3B2718', '#EF4444', '#16A34A', '#6C4A28'];

const MONTHLY_TRENDS = [
  { month: 'Jan', count: 12 }, { month: 'Feb', count: 15 }, { month: 'Mar', count: 11 },
  { month: 'Apr', count: 18 }, { month: 'May', count: 22 }, { month: 'Jun', count: 24 }
];

const LITIGATION_CATEGORIES = [
  { category: 'Labor Dispute', count: 18 },
  { category: 'Debt Recovery', count: 42 },
  { category: 'Breach of Contract', count: 15 },
  { category: 'Property Claim', count: 8 },
  { category: 'Regulatory', count: 5 }
];

const RECENT_HEARINGS = [
  { id: 'LIT-2026-041', case: 'Nib Bank vs. Global Tech', type: 'Hearing', date: 'Today, 10:00 AM', status: 'Pending', court: 'Federal High Court' },
  { id: 'LIT-2026-038', case: 'Abebe T. vs Nib Bank', type: 'Verdict', date: 'Tomorrow, 2:00 PM', status: 'Scheduled', court: 'Supreme Court' },
  { id: 'LIT-2026-045', case: 'Nib Bank vs. Zeta PLC', type: 'Filing', date: 'Jul 5, 2026', status: 'Pending', court: 'First Instance Court' },
];

export default function LitigationDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const statCards = [
    { title: 'Total Active Cases', value: 88, icon: <Scale size={20} />, color: 'accent' },
    { title: 'Upcoming Hearings', value: 12, icon: <Calendar size={20} />, color: 'warning' },
    { title: 'High Risk Cases', value: 5, icon: <AlertTriangle size={20} />, color: 'danger' },
    { title: 'Total Exposure', value: '24.5M', icon: <DollarSign size={20} />, color: 'info' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-10">
      
      {/* ── Header & Toolbar ── */}
      <div className="flex justify-between items-center bg-card p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold m-0 flex items-center gap-3 text-primary">
            <Gavel size={24} className="text-accent" /> Litigation Management
          </h1>
          <p className="text-sm text-muted mt-1">Enterprise dashboard for tracking court cases, hearings, and financial exposure.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search cases..." 
              className="form-control pl-9 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary"><Filter size={16} /> Filters</button>
          <button className="btn btn-primary"><Plus size={16} /> New Case File</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <h3 className="font-bold flex items-center gap-2"><TrendingUp size={16} className="text-accent"/> Monthly Case Volume</h3>
            <button className="btn btn-ghost btn-sm text-xs">Full Report <ArrowUpRight size={12}/></button>
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
            <h3 className="font-bold flex items-center gap-2"><PieChart size={16} className="text-info"/> Cases by Type</h3>
          </div>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={LITIGATION_CATEGORIES} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {LITIGATION_CATEGORIES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2">
            {LITIGATION_CATEGORIES.map((cat, i) => (
              <div key={i} className="flex justify-between items-center text-sm p-2 hover:bg-bg-surface rounded-md transition-colors">
                <span className="flex items-center gap-2 font-medium">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                  {cat.category}
                </span>
                <span className="font-mono text-muted">{cat.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Hearings Data Table */}
        <div className="card lg:col-span-2 p-0 overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between bg-bg-surface">
             <h3 className="font-bold flex items-center gap-2"><Calendar size={16} className="text-warning"/> Court Schedule</h3>
             <button className="btn btn-ghost btn-sm text-xs">View Calendar <ArrowRight size={12}/></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-input text-muted text-xs uppercase tracking-wider font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-4">Case Details</th>
                  <th className="py-3 px-4">Schedule</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {RECENT_HEARINGS.map((h, i) => (
                  <tr key={i} className="hover:bg-card-hover transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-primary">{h.case}</div>
                      <div className="text-xs text-muted font-mono">{h.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-warning flex items-center gap-1.5"><Calendar size={12}/> {h.date}</div>
                      <div className="text-xs text-muted mt-1">{h.type}</div>
                    </td>
                    <td className="py-3 px-4 text-secondary">{h.court}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="btn btn-secondary btn-sm">Prepare Docs</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Panel */}
        <div className="card border-warning/30 bg-warning/5">
          <div className="flex items-center justify-between border-b border-warning/10 pb-4 mb-4">
            <h3 className="font-bold flex items-center gap-2 text-warning-hover"><AlertTriangle size={16}/> Risk Assessment</h3>
          </div>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-warning-hover">
              <strong>Action Required:</strong> You have 5 High-Risk cases that require Executive Summary reports for the Board of Directors.
            </p>
            <button className="btn btn-warning w-full justify-center">Generate Risk Reports</button>
          </div>
        </div>

      </div>
    </div>
  );
}
