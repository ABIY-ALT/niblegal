'use client';
import { useState, useEffect } from 'react';
import { contracts, advisoryRequests, USERS, getCMSStats, getLAHDStats, getAllAuditTrail, currentUser } from '@/data/store';
import { CONTRACT_CATEGORY_LABELS, URGENCY_COLORS, CONTRACT_STATUS_COLORS, ADVISORY_STATUS_COLORS, CONTRACT_STATUS_LABELS, formatDate, timeAgo } from '@/utils/formatters';
import { 
  FileText, Scale, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, 
  BarChart3, Activity, Zap, ArrowRight, Timer, Bell, Search, Plus, Upload, 
  FolderSearch, Calendar, ChevronRight, Briefcase 
} from 'lucide-react';
import Link from 'next/link';

// Simulated notifications separated by type
const INITIAL_NOTIFICATIONS = {
  critical: [
    { id: 2, type: 'sla', title: 'SLA Breach Warning', message: 'Critical advisory NIB-LAHD-2026-00016 has breached its 24-hour SLA deadline.', time: '5 hours ago', read: false, link: '/advisory' },
  ],
  expiry: [
    { id: 1, type: 'expiry', title: 'Contract Expiring Soon', message: 'Contract NIB-CMS-2026-00012 (Head Office Lease) expires in 25 days. Please initiate renewal.', time: '2 hours ago', read: false, link: '/contracts' },
  ],
  general: [
    { id: 3, type: 'workflow', title: 'New Manager Approval Required', message: 'Contract NIB-CMS-2026-00028 has been submitted for your approval by Yonas Bekele.', time: 'Yesterday', read: true, link: '/contracts' },
  ]
};

// ─── UI Components ─────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, paddingTop: 16 }}>
      {data.map((d, i) => (
        <div key={i} className="chart-bar-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }} title={`${d.label}: ${d.value}`}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{d.value}</span>
          <div style={{ width: '100%', maxWidth: 40, height: `${(d.value / max) * 100}px`, minHeight: d.value ? 4 : 0, background: d.color, borderRadius: '6px 6px 0 0', transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, size = 120 }: { segments: { value: number; color: string; label: string }[]; size?: number }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const r = 45; const cx = 60; const cy = 60;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="16" />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="16"
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={-offset}
            strokeLinecap="round" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dasharray 1s ease-out' }} />
        );
        offset += dash;
        return el;
      })}
      <text x="60" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill="var(--text-primary)">{total}</text>
    </svg>
  );
}

function StatCard({ label, value, sub, icon, color, trend }: { label: string; value: number | string; sub?: string; icon: React.ReactNode; color: string; trend?: string }) {
  return (
    <div className="stat-card" style={{ 
      position: 'relative', overflow: 'hidden', background: 'var(--bg-card)', 
      border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', 
      padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s, box-shadow 0.2s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
        {trend && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: 20 }}><TrendingUp size={12} />{trend}</div>}
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ position: 'absolute', bottom: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`, pointerEvents: 'none' }} />
    </div>
  );
}

function QuickActionBtn({ icon, label, href, primary = false }: { icon: React.ReactNode, label: string, href: string, primary?: boolean }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 16px',
        background: primary ? 'var(--accent)' : 'var(--bg-card)',
        color: primary ? '#fff' : 'var(--text-primary)',
        border: primary ? 'none' : '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', cursor: 'pointer', textAlign: 'center',
        boxShadow: primary ? '0 8px 16px rgba(37,99,235,0.2)' : '0 2px 8px rgba(0,0,0,0.02)',
        transition: 'all 0.2s', height: '100%', justifyContent: 'center'
      }} className="hover:scale-105">
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: primary ? 'rgba(255,255,255,0.2)' : 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      </div>
    </Link>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const cms = getCMSStats();
  const lahd = getLAHDStats();
  const now = new Date();

  useEffect(() => {
    setAuditTrail(getAllAuditTrail());
  }, []);

  // Alerts
  const expiring = contracts.filter(c => c.status === 'expiring_soon');
  const critical = advisoryRequests.filter(r => r.urgency === 'critical' && !['dispatched','closed'].includes(r.status));
  const slaBreachedContracts = contracts.filter(c => c.slaDeadline && new Date(c.slaDeadline) < now && !['active','executed','expired','terminated'].includes(c.status));
  const pendingReviews = contracts.filter(c => c.status === 'under_review').length;
  const pendingApprovals = cms.pendingApproval + lahd.pendingApproval;

  // Work Queue (Role-based)
  const isManager = currentUser.role === 'manager';
  const isOfficer = currentUser.role === 'legal_officer';
  const isRequesting = currentUser.role === 'requesting_organ';

  let myContracts = contracts;
  let myAdvisory = advisoryRequests;
  if (isOfficer) {
    myContracts = contracts.filter(c => c.assignedOfficer === currentUser.name);
    myAdvisory = advisoryRequests.filter(r => r.assignedOfficer === currentUser.name);
  } else if (isRequesting) {
    myContracts = contracts.filter(c => c.requestedBy === currentUser.name);
    myAdvisory = advisoryRequests.filter(r => r.requestedBy === currentUser.name);
  }

  const draftsCount = myContracts.filter(c => c.status === 'draft').length;
  const myPendingReviews = myContracts.filter(c => c.status === 'under_review').length;
  const myPendingApprovals = isManager ? pendingApprovals : 0; // managers see all pending approvals
  const overdueCount = myContracts.filter(c => c.slaDeadline && new Date(c.slaDeadline) < now && !['active','executed','expired','terminated'].includes(c.status)).length + 
                       myAdvisory.filter(r => r.slaDeadline && new Date(r.slaDeadline) < now && !['dispatched','closed'].includes(r.status)).length;

  // Charts
  const catCounts = Object.keys(CONTRACT_CATEGORY_LABELS) as any[];
  const contractsByCategory = catCounts.map(cat => ({
    label: (CONTRACT_CATEGORY_LABELS as any)[cat].split(' ')[0],
    value: contracts.filter(c => c.category === cat).length,
    color: cat === 'service_agreement' ? '#3b82f6' : cat === 'lease' ? '#10b981' : cat === 'nda' ? '#f59e0b' : '#8b5cf6',
  })).filter(d => d.value > 0);

  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const monthlyContracts = [3, 5, 2, 7, 4, contracts.length];
  const monthlyAdvisory = [2, 3, 4, 2, 5, advisoryRequests.length];

  const officers = USERS.filter(u => u.role === 'legal_officer');

  // Deadlines
  const upcomingDeadlines = [
    ...contracts.filter(c => c.status === 'expiring_soon').map(c => ({ id: c.id, title: c.title, date: c.expiryDate, type: 'Expiry', color: 'var(--warning)' })),
    ...contracts.filter(c => c.slaDeadline && !['active','executed','expired','terminated'].includes(c.status)).map(c => ({ id: c.id, title: c.title, date: c.slaDeadline, type: 'SLA Due', color: 'var(--danger)' })),
    ...advisoryRequests.filter(r => r.slaDeadline && !['dispatched','closed'].includes(r.status)).map(r => ({ id: r.id, title: r.title, date: r.slaDeadline, type: 'SLA Due', color: 'var(--danger)' }))
  ].sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

      {/* ── Top Bar: Global Search & Welcome ──────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '20px 24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: 0, fontFamily: 'Outfit, sans-serif' }}>Welcome back, {currentUser.name.split(' ')[0]}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Here is what's happening in your legal operations today.</p>
        </div>
        <div style={{ position: 'relative', width: 400 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search contracts, requests, officers, keywords..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 16px 12px 42px', borderRadius: 30, 
              border: '1px solid var(--border)', background: 'var(--bg-body)',
              fontSize: 14, color: 'var(--text-primary)', outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>
      </div>

      {/* ── Alert Banner ──────────────────────────────────────────────────── */}
      {(expiring.length > 0 || critical.length > 0 || slaBreachedContracts.length > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {expiring.length > 0 && (
            <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
              <AlertTriangle size={18} /><strong>{expiring.length} contract(s)</strong>&nbsp;expiring within 30 days — immediate renewal action required.
            </div>
          )}
          {critical.length > 0 && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
              <Zap size={18} /><strong>{critical.length} critical advisory</strong>&nbsp;request(s) pending — SLA deadline approaching.
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24 }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Quick Actions */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={16} color="var(--accent)" /> Quick Actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <QuickActionBtn icon={<Plus size={24} />} label="New Contract" href="/contracts/new" primary />
              <QuickActionBtn icon={<Scale size={24} />} label="New Legal Advice" href="/advisory/new" />
              {!isRequesting && <QuickActionBtn icon={<Upload size={24} />} label="Upload Contract" href="/repository/upload" />}
              <QuickActionBtn icon={<FolderSearch size={24} />} label="Search Repository" href="/repository" />
            </div>
          </div>

          {/* KPI Cards */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} color="var(--accent)" /> Key Performance Indicators
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <StatCard label="Total Contracts" value={cms.totalContracts} sub="All time repository" icon={<FileText size={20} />} color="#3b82f6" trend="+12% this month" />
              <StatCard label="Active Contracts" value={cms.active} sub="Currently in force" icon={<CheckCircle size={20} />} color="#10b981" />
              <StatCard label="Pending Approvals" value={pendingApprovals} sub="Awaiting manager sign-off" icon={<Clock size={20} />} color="#f59e0b" />
              <StatCard label="SLA Breached" value={lahd.slaBreached + slaBreachedContracts.length} sub="Overdue tasks" icon={<AlertTriangle size={20} />} color="#ef4444" />
            </div>
          </div>

          {/* Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {/* Contracts by Category */}
            <div className="card" style={{ padding: 24 }}>
              <div className="card-header" style={{ marginBottom: 20 }}><span className="card-title" style={{ fontSize: 16 }}>Contracts by Category</span></div>
              {contractsByCategory.length > 0 ? <BarChart data={contractsByCategory} /> : <div className="empty-state">No data</div>}
            </div>

            {/* Monthly Legal Activities */}
            <div className="card" style={{ padding: 24 }}>
              <div className="card-header" style={{ marginBottom: 20 }}><span className="card-title" style={{ fontSize: 16 }}>Monthly Legal Activities</span></div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, paddingTop: 16 }}>
                {months.map((m, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', display: 'flex', gap: 4, alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div style={{ width: '40%', maxWidth: 16, height: `${(monthlyContracts[i] / 10) * 100}px`, background: 'var(--accent)', borderRadius: '4px 4px 0 0', minHeight: monthlyContracts[i] ? 4 : 0 }} title={`Contracts: ${monthlyContracts[i]}`} />
                      <div style={{ width: '40%', maxWidth: 16, height: `${(monthlyAdvisory[i] / 10) * 100}px`, background: 'var(--gold)', borderRadius: '4px 4px 0 0', minHeight: monthlyAdvisory[i] ? 4 : 0 }} title={`Advisory: ${monthlyAdvisory[i]}`} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 20, fontSize: 12, fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: 'var(--accent)', borderRadius: 3, display: 'inline-block' }} />Contracts Drafted</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, background: 'var(--gold)', borderRadius: 3, display: 'inline-block' }} />Advisory Rendered</span>
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="card" style={{ padding: 24 }}>
            <div className="card-header" style={{ marginBottom: 20 }}>
              <span className="card-title" style={{ fontSize: 16 }}><Activity size={18} style={{ display: 'inline', marginRight: 8, color: 'var(--accent)' }} />Recent Activity</span>
              <Link href="/reports" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>Full Audit Trail <ChevronRight size={14} /></Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {auditTrail.slice(0, 6).map((entry, i) => (
                <div key={entry.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                  {i !== 5 && <div style={{ position: 'absolute', left: 19, top: 40, bottom: -16, width: 2, background: 'var(--border)' }} />}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: entry.module === 'CMS' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, border: '2px solid var(--bg-card)' }}>
                    {entry.action === 'approved' ? <CheckCircle size={18} color="var(--success)" /> : 
                     entry.action === 'submitted' ? <FileText size={18} color="var(--accent)" /> : 
                     <Briefcase size={18} color="var(--text-muted)" />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: i !== 5 ? 16 : 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                        <span style={{ fontWeight: 700 }}>{entry.userName}</span> {entry.action} — <span style={{ color: 'var(--text-secondary)' }}>{entry.details}</span>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 16 }}>{timeAgo(entry.timestamp)}</span>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <span className="badge" style={{ fontSize: 11, background: 'var(--bg-input)', color: 'var(--text-muted)' }}>{entry.module} Module</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* My Work Queue */}
          <div className="card" style={{ padding: 20, background: 'linear-gradient(180deg, var(--bg-card) 0%, rgba(37,99,235,0.02) 100%)', border: '1px solid rgba(37,99,235,0.2)' }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <span className="card-title" style={{ fontSize: 16, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={18} /> My Work Queue
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Drafts</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>{draftsCount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Reviews</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: myPendingReviews > 0 ? 'var(--info)' : 'var(--text-primary)' }}>{myPendingReviews}</span>
              </div>
              {isManager && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>Pending Approvals</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: myPendingApprovals > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>{myPendingApprovals}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: overdueCount > 0 ? 'rgba(239,68,68,0.1)' : 'var(--bg-body)', borderRadius: 'var(--radius-md)', border: `1px solid ${overdueCount > 0 ? 'var(--danger)' : 'var(--border)'}` }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: overdueCount > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>Overdue Tasks</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: overdueCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{overdueCount}</span>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="card" style={{ padding: 20 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <span className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={18} color="var(--warning)" /> Upcoming Deadlines</span>
            </div>
            {upcomingDeadlines.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcomingDeadlines.map((dl, i) => (
                  <div key={i} style={{ padding: '12px', borderLeft: `3px solid ${dl.color}`, background: 'var(--bg-input)', borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dl.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: dl.color, fontWeight: 600 }}>{dl.type}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{formatDate(dl.date as string)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No upcoming deadlines.</div>
            )}
          </div>

          {/* Notifications Separated */}
          <div className="card" style={{ padding: 20 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <span className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={18} color="var(--info)" /> Notifications</span>
              <Link href="/notifications" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View All</Link>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {INITIAL_NOTIFICATIONS.critical.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--danger)', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>Critical Alerts</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {INITIAL_NOTIFICATIONS.critical.map(n => (
                      <div key={n.id} style={{ padding: 12, background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {INITIAL_NOTIFICATIONS.expiry.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--warning)', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>Expiry Alerts</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {INITIAL_NOTIFICATIONS.expiry.map(n => (
                      <div key={n.id} style={{ padding: 12, background: 'rgba(245,158,11,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {INITIAL_NOTIFICATIONS.general.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>General</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {INITIAL_NOTIFICATIONS.general.map(n => (
                      <div key={n.id} style={{ padding: 12, background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Officer Workload (For Managers) */}
          {isManager && (
            <div className="card" style={{ padding: 20 }}>
              <div className="card-header" style={{ marginBottom: 16 }}>
                <span className="card-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Users size={18} color="var(--accent)" /> Officer Workload</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {officers.map(officer => {
                  const cmsCount = contracts.filter(c => c.assignedOfficer === officer.name && !['active','executed','expired','terminated'].includes(c.status)).length;
                  const lahdCount = advisoryRequests.filter(r => r.assignedOfficer === officer.name && !['dispatched','closed'].includes(r.status)).length;
                  const total = cmsCount + lahdCount;
                  const maxLoad = 8;
                  const pct = Math.min((total / maxLoad) * 100, 100);
                  const loadColor = pct > 75 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--success)';
                  return (
                    <div key={officer.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{officer.name}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{cmsCount} CMS · {lahdCount} LAHD</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: loadColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}