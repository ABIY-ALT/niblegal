'use client';

import { useState } from 'react';
import { contracts, advisoryRequests, USERS, getAllAuditTrail } from '@/data/store';
import { 
  CONTRACT_STATUS_LABELS, 
  ADVISORY_STATUS_LABELS, 
  ADVISORY_CATEGORY_LABELS, 
  CONTRACT_CATEGORY_LABELS, 
  formatDate,
  formatDateTime
} from '@/utils/formatters';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Download, 
  Calendar, 
  Filter, 
  FileText, 
  FileSpreadsheet, 
  Gavel, 
  Activity, 
  History, 
  PieChart
} from 'lucide-react';

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

function Pie({ data, colors }: { data: { label: string; value: number }[], colors: string[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div style={{ 
        width: 150, 
        height: 150, 
        borderRadius: '50%', 
        background: `conic-gradient(${data.map((d, i) => {
          const startAngle = currentAngle;
          currentAngle += (d.value / total) * 360;
          return `${colors[i % colors.length]} ${startAngle}deg ${currentAngle}deg`;
        }).join(', ')})`
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: colors[i % colors.length] }} />
            <span style={{ fontSize: 13 }}>{d.label}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  // State for tabs and filters
  const [activeTab, setActiveTab] = useState<'contracts' | 'legal' | 'sla' | 'performance' | 'audit'>('contracts');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [cmsStatusFilter, setCmsStatusFilter] = useState<string>('all');
  const [cmsCategoryFilter, setCmsCategoryFilter] = useState<string>('all');
  const [lahdStatusFilter, setLahdStatusFilter] = useState<string>('all');
  const [lahdCategoryFilter, setLahdCategoryFilter] = useState<string>('all');
  const [officerFilter, setOfficerFilter] = useState<string>('all');

  // Get unique officers
  const officers = USERS.filter(u => u.role === 'legal_officer');

  // Filter contracts
  const filteredContracts = contracts.filter(c => {
    let matches = true;
    if (startDate && c.createdAt < startDate) matches = false;
    if (endDate && c.createdAt > endDate) matches = false;
    if (cmsStatusFilter !== 'all' && c.status !== cmsStatusFilter) matches = false;
    if (cmsCategoryFilter !== 'all' && c.category !== cmsCategoryFilter) matches = false;
    if (officerFilter !== 'all' && c.assignedOfficer !== officerFilter) matches = false;
    return matches;
  });

  // Filter advisory requests
  const filteredAdvisory = advisoryRequests.filter(r => {
    let matches = true;
    if (startDate && r.createdAt < startDate) matches = false;
    if (endDate && r.createdAt > endDate) matches = false;
    if (lahdStatusFilter !== 'all' && r.status !== lahdStatusFilter) matches = false;
    if (lahdCategoryFilter !== 'all' && r.category !== lahdCategoryFilter) matches = false;
    if (officerFilter !== 'all' && r.assignedOfficer !== officerFilter) matches = false;
    return matches;
  });

  // Get audit trail
  const auditTrail = getAllAuditTrail().filter(e => {
    if (startDate && e.timestamp < startDate) return false;
    if (endDate && e.timestamp > endDate) return false;
    return true;
  });

  // Calculate counts
  const cmsStatusCounts = Object.fromEntries(
    Object.keys(CONTRACT_STATUS_LABELS).map(s => [s, filteredContracts.filter(c => c.status === s).length])
  );
  const cmsCatCounts = Object.fromEntries(
    Object.keys(CONTRACT_CATEGORY_LABELS).map(c => [c, filteredContracts.filter(x => x.category === c).length])
  );
  const lahdStatusCounts = Object.fromEntries(
    Object.keys(ADVISORY_STATUS_LABELS).map(s => [s, filteredAdvisory.filter(r => r.status === s).length])
  );
  const lahdCatCounts = Object.fromEntries(
    Object.keys(ADVISORY_CATEGORY_LABELS).map(c => [c, filteredAdvisory.filter(r => r.category === c).length])
  );

  // Filtered officer workload
  const officerCMS = officers.map(o => ({ 
    name: o.name, 
    count: filteredContracts.filter(c => c.assignedOfficer === o.name).length,
    active: filteredContracts.filter(c => c.assignedOfficer === o.name && c.status === 'active').length,
    pending: filteredContracts.filter(c => c.assignedOfficer === o.name && c.status === 'pending_approval').length
  })).filter(o => o.count > 0 || officerFilter === 'all' || officerFilter === o.name);

  const officerLAHD = officers.map(o => ({ 
    name: o.name, 
    count: filteredAdvisory.filter(r => r.assignedOfficer === o.name).length,
    drafting: filteredAdvisory.filter(r => r.assignedOfficer === o.name && r.status === 'drafting').length,
    pending: filteredAdvisory.filter(r => r.assignedOfficer === o.name && r.status === 'pending_approval').length
  })).filter(o => o.count > 0 || officerFilter === 'all' || officerFilter === o.name);

  // SLA from filtered data
  const withinSLA = filteredAdvisory.filter(r => 
    new Date(r.slaDeadline) > new Date() || ['dispatched', 'closed'].includes(r.status)
  ).length;
  const slaBreached = filteredAdvisory.filter(r => 
    new Date(r.slaDeadline) < new Date() && !['dispatched', 'closed'].includes(r.status)
  ).length;

  const maxCMS = Math.max(...Object.values(cmsStatusCounts), 1);
  const maxLAHD = Math.max(...Object.values(lahdStatusCounts), 1);

  // Export functions
  const exportContractsCSV = () => {
    const headers = ['ID', 'Title', 'Status', 'Category', 'Parties', 'Effective Date', 'Expiry Date'];
    const csv = [
      headers.join(','),
      ...filteredContracts.map(c => [
        c.id,
        `"${c.title}"`,
        `"${CONTRACT_STATUS_LABELS[c.status]}"`,
        `"${CONTRACT_CATEGORY_LABELS[c.category]}"`,
        `"${c.counterparty}"`,
        `"${c.startDate ? formatDate(c.startDate) : ''}"`,
        `"${c.expiryDate ? formatDate(c.expiryDate) : ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nib-contracts-report.csv');
    link.click();
  };

  const exportAdvisoryCSV = () => {
    const headers = ['ID', 'Requester', 'Subject', 'Status', 'Category', 'Priority', 'SLA Deadline'];
    const csv = [
      headers.join(','),
      ...filteredAdvisory.map(r => [
        r.id,
        `"${r.requestedBy}"`,
        `"${r.title}"`,
        `"${ADVISORY_STATUS_LABELS[r.status]}"`,
        `"${ADVISORY_CATEGORY_LABELS[r.category]}"`,
        `"${r.urgency}"`,
        `"${formatDateTime(r.slaDeadline)}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nib-advisory-report.csv');
    link.click();
  };

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Details', 'Module'];
    const csv = [
      headers.join(','),
      ...auditTrail.map(e => [
        `"${formatDateTime(e.timestamp)}"`,
        `"${e.userName}"`,
        `"${e.action}"`,
        `"${e.details}"`,
        `"${e.module}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nib-audit-report.csv');
    link.click();
  };

  const exportAllCSV = () => {
    // Combine all reports
    const allData = [
      '=== CONTRACTS REPORT ===',
      ['ID', 'Title', 'Status', 'Category', 'Parties', 'Effective Date', 'Expiry Date'].join(','),
      ...filteredContracts.map(c => [
        c.id, `"${c.title}"`, `"${CONTRACT_STATUS_LABELS[c.status]}"`, `"${CONTRACT_CATEGORY_LABELS[c.category]}"`, 
        `"${c.counterparty}"`, `"${c.startDate ? formatDate(c.startDate) : ''}"`, `"${c.expiryDate ? formatDate(c.expiryDate) : ''}"`
      ].join(',')),
      '',
      '=== LEGAL ADVICE REPORT ===',
      ['ID', 'Requester', 'Subject', 'Status', 'Category', 'Priority', 'SLA Deadline'].join(','),
      ...filteredAdvisory.map(r => [
        r.id, `"${r.requestedBy}"`, `"${r.title}"`, `"${ADVISORY_STATUS_LABELS[r.status]}"`, 
        `"${ADVISORY_CATEGORY_LABELS[r.category]}"`, `"${r.urgency}"`, `"${formatDateTime(r.slaDeadline)}"`
      ].join(',')),
      '',
      '=== AUDIT TRAIL ===',
      ['Timestamp', 'User', 'Action', 'Details', 'Module'].join(','),
      ...auditTrail.map(e => [
        `"${formatDateTime(e.timestamp)}"`, `"${e.userName}"`, `"${e.action}"`, `"${e.details}"`, `"${e.module}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([allData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nib-all-reports.csv');
    link.click();
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCmsStatusFilter('all');
    setCmsCategoryFilter('all');
    setLahdStatusFilter('all');
    setLahdCategoryFilter('all');
    setOfficerFilter('all');
  };

  const getExportFunction = () => {
    switch (activeTab) {
      case 'contracts': return exportContractsCSV;
      case 'legal': return exportAdvisoryCSV;
      case 'audit': return exportAuditCSV;
      default: return exportAllCSV;
    }
  };

  const exportPDF = () => {
    // Simple PDF export simulation using print
    const originalContents = document.body.innerHTML;
    const printContent = `
      <div style="padding: 40px; font-family: Arial, sans-serif;">
        <h1 style="text-align: center; color: #B8860B;">NIB Bank Reports</h1>
        <h2 style="color: #333;">${activeTab === 'contracts' ? 'Contracts Report' : activeTab === 'legal' ? 'Legal Advice Report' : activeTab === 'sla' ? 'SLA Report' : activeTab === 'performance' ? 'Performance Report' : 'Audit Trail Report'}</h2>
        <p style="color: #666;">Generated: ${formatDateTime(new Date().toISOString())}</p>
        <hr style="border-color: #ddd;">
        ${activeTab === 'contracts' ? `
          <h3>Contracts by Status</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px;">Status</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Count</th>
            </tr>
            ${Object.entries(cmsStatusCounts).map(([status, count]) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${CONTRACT_STATUS_LABELS[status as any]}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${count}</td>
              </tr>
            `).join('')}
          </table>
        ` : activeTab === 'legal' ? `
          <h3>Legal Advice by Status</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px;">Status</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Count</th>
            </tr>
            ${Object.entries(lahdStatusCounts).map(([status, count]) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${ADVISORY_STATUS_LABELS[status as any]}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${count}</td>
              </tr>
            `).join('')}
          </table>
        ` : activeTab === 'audit' ? `
          <h3>Audit Trail</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px;">Timestamp</th>
              <th style="border: 1px solid #ddd; padding: 8px;">User</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Action</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Details</th>
              <th style="border: 1px solid #ddd; padding: 8px;">Module</th>
            </tr>
            ${auditTrail.map(e => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${formatDateTime(e.timestamp)}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${e.userName}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${e.action}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${e.details}</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${e.module}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
      </div>
    `;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div>
      {/* Filters Section */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Filter size={20} /> Report Filters
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={resetFilters} className="btn btn-ghost btn-sm">Reset All Filters</button>
            <button onClick={exportPDF} className="btn btn-secondary btn-sm">
              <FileText size={14} style={{ marginRight: 6 }} /> Export PDF
            </button>
            <button onClick={getExportFunction()} className="btn btn-primary btn-sm">
              <FileSpreadsheet size={14} style={{ marginRight: 6 }} /> Export Excel
            </button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} /> Start Date
            </label>
            <input 
              type="date" 
              className="form-control" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} /> End Date
            </label>
            <input 
              type="date" 
              className="form-control" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Contract Status</label>
            <select 
              className="form-control" 
              value={cmsStatusFilter} 
              onChange={e => setCmsStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.entries(CONTRACT_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v as string}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Contract Category</label>
            <select 
              className="form-control" 
              value={cmsCategoryFilter} 
              onChange={e => setCmsCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {Object.entries(CONTRACT_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v as string}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Advisory Status</label>
            <select 
              className="form-control" 
              value={lahdStatusFilter} 
              onChange={e => setLahdStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              {Object.entries(ADVISORY_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v as string}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Advisory Category</label>
            <select 
              className="form-control" 
              value={lahdCategoryFilter} 
              onChange={e => setLahdCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {Object.entries(ADVISORY_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v as string}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Officer</label>
            <select 
              className="form-control" 
              value={officerFilter} 
              onChange={e => setOfficerFilter(e.target.value)}
            >
              <option value="all">All Officers</option>
              {officers.map(o => (
                <option key={o.id} value={o.name}>{o.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <button className={`tab-btn ${activeTab === 'contracts' ? 'active' : ''}`} onClick={() => setActiveTab('contracts')}>
          <FileText size={16} style={{ marginRight: 8 }} /> Contracts
        </button>
        <button className={`tab-btn ${activeTab === 'legal' ? 'active' : ''}`} onClick={() => setActiveTab('legal')}>
          <Gavel size={16} style={{ marginRight: 8 }} /> Legal Advice
        </button>
        <button className={`tab-btn ${activeTab === 'sla' ? 'active' : ''}`} onClick={() => setActiveTab('sla')}>
          <Clock size={16} style={{ marginRight: 8 }} /> SLA
        </button>
        <button className={`tab-btn ${activeTab === 'performance' ? 'active' : ''}`} onClick={() => setActiveTab('performance')}>
          <Activity size={16} style={{ marginRight: 8 }} /> Performance
        </button>
        <button className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`} onClick={() => setActiveTab('audit')}>
          <History size={16} style={{ marginRight: 8 }} /> Audit
        </button>
      </div>

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title"><BarChart3 size={16} style={{ display: 'inline', marginRight: 6 }} /> Contracts by Status</span>
              </div>
              {Object.entries(cmsStatusCounts).map(([s, v]) => (
                <Bar key={s} label={CONTRACT_STATUS_LABELS[s as any]} value={v} max={maxCMS} color="var(--accent)" />
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title"><PieChart size={16} style={{ display: 'inline', marginRight: 6 }} /> Contracts by Category</span>
              </div>
              <Pie 
                data={Object.entries(cmsCatCounts).filter(([, v]) => v > 0).map(([k, v]) => ({ label: CONTRACT_CATEGORY_LABELS[k as any], value: v }))}
                colors={['#B8860B', '#DAA520', '#CD853F', '#DEB887', '#F4A460', '#FA8072', '#E9967A']}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title"><Users size={16} style={{ display: 'inline', marginRight: 6 }} /> Officer Workload - Contracts</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Officer</th><th>Contracts Assigned</th><th>Active</th><th>Pending Approval</th></tr></thead>
                <tbody>
                  {officerCMS.map(o => (
                    <tr key={o.name}>
                      <td style={{ fontWeight: 600 }}>{o.name}</td>
                      <td>{o.count}</td>
                      <td>{o.active}</td>
                      <td>{o.pending}</td>
                    </tr>
                  ))}
                  {officerCMS.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No contracts for selected filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Legal Advice Tab */}
      {activeTab === 'legal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title"><BarChart3 size={16} style={{ display: 'inline', marginRight: 6 }} /> Legal Advice by Status</span>
              </div>
              {Object.entries(lahdStatusCounts).map(([s, v]) => (
                <Bar key={s} label={ADVISORY_STATUS_LABELS[s as any]} value={v} max={maxLAHD} color="var(--gold)" />
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title"><PieChart size={16} style={{ display: 'inline', marginRight: 6 }} /> Legal Advice by Category</span>
              </div>
              <Pie 
                data={Object.entries(lahdCatCounts).filter(([, v]) => v > 0).map(([k, v]) => ({ label: ADVISORY_CATEGORY_LABELS[k as any], value: v }))}
                colors={['#2E8B57', '#3CB371', '#90EE90', '#00FA9A', '#00CED1', '#20B2AA', '#5F9EA0']}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title"><Users size={16} style={{ display: 'inline', marginRight: 6 }} /> Officer Workload - Legal Advice</span>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Officer</th><th>Requests Assigned</th><th>Drafting</th><th>Pending Approval</th></tr></thead>
                <tbody>
                  {officerLAHD.map(o => (
                    <tr key={o.name}>
                      <td style={{ fontWeight: 600 }}>{o.name}</td>
                      <td>{o.count}</td>
                      <td>{o.drafting}</td>
                      <td>{o.pending}</td>
                    </tr>
                  ))}
                  {officerLAHD.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No requests for selected filters</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SLA Tab */}
      {activeTab === 'sla' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-header">
              <span className="card-title"><Clock size={16} style={{ display: 'inline', marginRight: 6 }} /> SLA Compliance Summary</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Total Advisory Requests', value: filteredAdvisory.length, color: 'var(--accent)' },
                { label: 'Within SLA', value: withinSLA, color: 'var(--success)' },
                { label: 'SLA Breached', value: slaBreached, color: 'var(--danger)' },
                { label: 'Avg Turnaround', value: '38h', color: 'var(--gold)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title"><PieChart size={16} style={{ display: 'inline', marginRight: 6 }} /> SLA Breach Distribution</span>
            </div>
            <Pie 
              data={[
                { label: 'Within SLA', value: withinSLA },
                { label: 'SLA Breached', value: slaBreached }
              ]}
              colors={['#2E8B57', '#DC143C']}
            />
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title"><TrendingUp size={16} style={{ display: 'inline', marginRight: 6 }} /> Contracts per Officer</span>
              </div>
              {officerCMS.map(o => (
                <Bar key={o.name} label={o.name} value={o.count} max={Math.max(...officerCMS.map(x => x.count), 1)} color="var(--accent)" />
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title"><TrendingUp size={16} style={{ display: 'inline', marginRight: 6 }} /> Legal Advice per Officer</span>
              </div>
              {officerLAHD.map(o => (
                <Bar key={o.name} label={o.name} value={o.count} max={Math.max(...officerLAHD.map(x => x.count), 1)} color="var(--gold)" />
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title"><Users size={16} style={{ display: 'inline', marginRight: 6 }} /> Overall Performance Summary</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Total Contracts', value: filteredContracts.length, color: 'var(--accent)' },
                { label: 'Total Legal Advice', value: filteredAdvisory.length, color: 'var(--gold)' },
                { label: 'Active Contracts', value: filteredContracts.filter(c => c.status === 'active').length, color: 'var(--success)' },
                { label: 'Dispatched Advice', value: filteredAdvisory.filter(r => r.status === 'dispatched').length, color: 'var(--info)' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Tab */}
      {activeTab === 'audit' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title"><History size={16} style={{ display: 'inline', marginRight: 6 }} /> Audit Trail</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Timestamp</th><th>User</th><th>Action</th><th>Details</th><th>Module</th></tr></thead>
              <tbody>
                {auditTrail.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontSize: 13 }}>{formatDateTime(e.timestamp)}</td>
                    <td style={{ fontWeight: 600 }}>{e.userName}</td>
                    <td>
                      <span className={`badge ${
                        e.action === 'approved' ? 'bg-green-100 text-green-800' : 
                        e.action === 'rejected' ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>{e.action}</span>
                    </td>
                    <td>{e.details}</td>
                    <td><span className="badge bg-purple-100 text-purple-800">{e.module}</span></td>
                  </tr>
                ))}
                {auditTrail.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No audit entries for selected filters</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
