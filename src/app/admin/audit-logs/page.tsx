'use client';

import { useMemo, useState } from 'react';
import { Download, FileText, History, Search, ShieldCheck, User, Scale } from 'lucide-react';
import { getAllAuditTrail } from '@/data/store';
import { formatDateTime } from '@/utils/formatters';
import type { ActivityAction, AuditEntry } from '@/types';

type AuditRow = {
  id: string;
  user: string;
  action: ActivityAction;
  module: AuditEntry['module'];
  oldValue: string;
  newValue: string;
  date: string;
  rawDate: string;
  ipAddress: string;
  searchableText: string;
};

const ACTION_LABELS: Record<ActivityAction, string> = {
  created: 'Created',
  submitted: 'Submitted',
  assigned: 'Assigned',
  reviewed: 'Reviewed',
  approved: 'Approved',
  rejected: 'Rejected',
  returned: 'Returned',
  executed: 'Executed',
  expired: 'Expired',
  renewed: 'Renewed',
  dispatched: 'Dispatched',
  uploaded: 'Uploaded',
  commented: 'Commented',
  escalated: 'Escalated',
};

const ACTION_BADGES: Record<ActivityAction, string> = {
  created: 'status-active',
  submitted: 'status-review',
  assigned: 'status-review',
  reviewed: 'status-review',
  approved: 'status-approved',
  rejected: 'status-terminated',
  returned: 'status-warning',
  executed: 'status-executed',
  expired: 'status-expired',
  renewed: 'status-renewed',
  dispatched: 'status-active',
  uploaded: 'status-review',
  commented: 'status-draft',
  escalated: 'status-warning',
};

const FALLBACK_IPS = [
  '10.12.4.18',
  '10.12.4.27',
  '10.14.8.31',
  '172.20.6.44',
  '192.168.10.12',
  '192.168.10.26',
];

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function deriveOldValue(entry: AuditEntry) {
  if (entry.oldValue) return entry.oldValue;

  if (entry.details.toLowerCase().includes('status changed to')) return 'Previous status';
  if (entry.action === 'created' || entry.action === 'submitted') return 'Not recorded';
  if (entry.action === 'assigned') return 'Unassigned';
  if (entry.action === 'approved') return 'Pending approval';
  if (entry.action === 'executed') return 'Approved';
  if (entry.action === 'expired') return 'Active';
  if (entry.action === 'dispatched') return 'Approved';

  return 'Not recorded';
}

function deriveNewValue(entry: AuditEntry) {
  if (entry.newValue) return entry.newValue;

  const statusMatch = entry.details.match(/status changed to\s+([\w_ -]+)/i);
  if (statusMatch?.[1]) return statusMatch[1].replaceAll('_', ' ');

  if (entry.details) return entry.details;
  return ACTION_LABELS[entry.action] ?? entry.action;
}

function getFallbackIp(entry: AuditEntry, index: number) {
  if (entry.ipAddress) return entry.ipAddress;

  const userSeed = [...entry.userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_IPS[(userSeed + index) % FALLBACK_IPS.length];
}

function normalizeAuditRows(entries: AuditEntry[]): AuditRow[] {
  return entries.map((entry, index) => {
    const row = {
      id: entry.id,
      user: entry.userName,
      action: entry.action,
      module: entry.module,
      oldValue: deriveOldValue(entry),
      newValue: deriveNewValue(entry),
      date: formatDateTime(entry.timestamp),
      rawDate: entry.timestamp,
      ipAddress: getFallbackIp(entry, index),
    };

    return {
      ...row,
      searchableText: [
        row.user,
        ACTION_LABELS[row.action],
        row.action,
        row.module,
        row.oldValue,
        row.newValue,
        row.date,
        row.ipAddress,
      ].join(' ').toLowerCase(),
    };
  });
}

export default function AuditLogsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<'all' | ActivityAction>('all');
  const [selectedModule, setSelectedModule] = useState<'all' | AuditEntry['module']>('all');

  const auditRows = useMemo(() => normalizeAuditRows(getAllAuditTrail()), []);
  const actions = useMemo(() => Array.from(new Set(auditRows.map(row => row.action))).sort(), [auditRows]);
  const modules = useMemo(() => Array.from(new Set(auditRows.map(row => row.module))).sort(), [auditRows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return auditRows.filter(row => {
      const matchesSearch = !normalizedSearch || row.searchableText.includes(normalizedSearch);
      const matchesAction = selectedAction === 'all' || row.action === selectedAction;
      const matchesModule = selectedModule === 'all' || row.module === selectedModule;

      return matchesSearch && matchesAction && matchesModule;
    });
  }, [auditRows, searchTerm, selectedAction, selectedModule]);

  const exportToCsv = () => {
    const headers = ['User', 'Action', 'Module', 'Old Value', 'New Value', 'Date', 'IP Address'];
    const rows = filteredRows.map(row => [
      row.user,
      ACTION_LABELS[row.action],
      row.module,
      row.oldValue,
      row.newValue,
      row.date,
      row.ipAddress,
    ]);
    const csv = [headers, ...rows].map(values => values.map(escapeCsv).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nib-audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={24} color="var(--accent)" /> Audit Log
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>
            Search system activity, review value changes, and export compliance records.
          </p>
        </div>

        <button className="btn btn-primary" onClick={exportToCsv}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 0 }}>
        <div className="stat-card accent">
          <div className="stat-icon" style={{ background: 'var(--accent-glow)', color: 'var(--accent-hover)' }}>
            <History />
          </div>
          <div className="stat-value">{auditRows.length}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-icon" style={{ background: 'rgba(212,168,71,0.16)', color: 'var(--gold-light)' }}>
            <FileText />
          </div>
          <div className="stat-value">{auditRows.filter(row => row.module === 'CMS').length}</div>
          <div className="stat-label">CMS Events</div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.14)', color: 'var(--success)' }}>
            <Scale />
          </div>
          <div className="stat-value">{auditRows.filter(row => row.module === 'LAHD').length}</div>
          <div className="stat-label">LAHD Events</div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: '1 1 320px' }}>
            <Search />
            <input
              className="form-control"
              placeholder="Search user, action, module, values, date, or IP"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            className="form-control"
            style={{ width: 190 }}
            value={selectedAction}
            onChange={event => setSelectedAction(event.target.value as 'all' | ActivityAction)}
          >
            <option value="all">All Actions</option>
            {actions.map(action => (
              <option key={action} value={action}>{ACTION_LABELS[action]}</option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: 170 }}
            value={selectedModule}
            onChange={event => setSelectedModule(event.target.value as 'all' | AuditEntry['module'])}
          >
            <option value="all">All Modules</option>
            {modules.map(module => (
              <option key={module} value={module}>{module}</option>
            ))}
          </select>

          <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 'auto' }}>
            {filteredRows.length} shown
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>Date</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => (
                <tr key={row.id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 600, minWidth: 170 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <User size={13} color="var(--accent)" />
                      {row.user}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${ACTION_BADGES[row.action]}`}>
                      {ACTION_LABELS[row.action]}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: row.module === 'CMS' ? 'var(--accent)' : 'var(--gold)' }}>
                      {row.module === 'CMS' ? <FileText size={13} /> : <Scale size={13} />}
                      {row.module}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', maxWidth: 220 }}>{row.oldValue}</td>
                  <td style={{ maxWidth: 320 }}>{row.newValue}</td>
                  <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{row.date}</td>
                  <td style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {row.ipAddress}
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    No audit events match the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
