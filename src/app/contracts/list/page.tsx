'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Plus, Download, ChevronLeft, ChevronRight,
  FileText, Filter, X, Grid3X3, List, FileSpreadsheet,
  ArrowUpDown, ArrowUp, ArrowDown, Eye,
  Calendar, Building2, Tag, TrendingUp, Clock, CheckCircle, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

// ── DB-shaped contract row (from /api/contracts) ─────────────────────────────
interface ContractRow {
  id: string;
  contractNumber: string;
  title: string;
  category: string;
  status: string;
  counterparty: string;
  value: string | number | null;
  currency: string | null;
  expiryDate: string | null;
  createdAt: string;
  requester?: { firstName: string; lastName: string } | null;
  assignee?: { firstName: string; lastName: string } | null;
  requestingDepartment?: { name: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', UNDER_REVIEW: 'Under Review', PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved', EXECUTED: 'Executed', ACTIVE: 'Active',
  EXPIRING_SOON: 'Expiring Soon', EXPIRED: 'Expired', TERMINATED: 'Terminated', RENEWED: 'Renewed',
};
const label = (s: string, map: Record<string, string> = STATUS_LABELS) => map[s] ?? s.replace(/_/g, ' ');
const catLabel = (c: string) => c.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
const statusBadge = (s: string) => `badge status-${s.toLowerCase().replace(/_/g, '-')}`;
const fmtDate = (d: string | null) => (d ? format(new Date(d), 'MMM d, yyyy') : '—');
const fmtMoney = (v: string | number | null, cur: string | null) =>
  v == null ? '—' : `${Number(v).toLocaleString()} ${cur ?? 'ETB'}`;
const ownerName = (c: ContractRow) => (c.requester ? `${c.requester.firstName} ${c.requester.lastName}` : '—');
const deptName = (c: ContractRow) => c.requestingDepartment?.name ?? '—';

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];
type SortField = 'contractNumber' | 'title' | 'status' | 'value' | 'expiryDate' | 'createdAt';
type SortDir = 'asc' | 'desc';

export default function ContractsListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const { data, isLoading, refetch } = useQuery<{ data: ContractRow[] }>({
    queryKey: ['contracts-list'],
    queryFn: async () => (await fetch('/api/contracts?limit=200')).json(),
  });
  const allContracts = useMemo(() => data?.data ?? [], [data]);

  const departments = useMemo(
    () => [...new Set(allContracts.map((c) => c.requestingDepartment?.name).filter(Boolean))] as string[],
    [allContracts],
  );

  const filtered = useMemo(() => {
    let result = [...allContracts];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.contractNumber.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) ||
        c.counterparty.toLowerCase().includes(q) || ownerName(c).toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter((c) => c.status === statusFilter);
    if (categoryFilter !== 'all') result = result.filter((c) => c.category === categoryFilter);
    if (deptFilter !== 'all') result = result.filter((c) => c.requestingDepartment?.name === deptFilter);
    if (dateFrom) result = result.filter((c) => c.createdAt >= dateFrom);
    if (dateTo) result = result.filter((c) => c.createdAt <= dateTo);

    result.sort((a, b) => {
      let aVal: string | number = '', bVal: string | number = '';
      switch (sortField) {
        case 'contractNumber': aVal = a.contractNumber; bVal = b.contractNumber; break;
        case 'title': aVal = a.title; bVal = b.title; break;
        case 'status': aVal = a.status; bVal = b.status; break;
        case 'value': aVal = Number(a.value) || 0; bVal = Number(b.value) || 0; break;
        case 'expiryDate': aVal = a.expiryDate || ''; bVal = b.expiryDate || ''; break;
        default: aVal = a.createdAt; bVal = b.createdAt;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [allContracts, search, statusFilter, categoryFilter, deptFilter, dateFrom, dateTo, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };
  const clearFilters = () => {
    setStatusFilter('all'); setCategoryFilter('all'); setDeptFilter('all');
    setDateFrom(''); setDateTo(''); setSearch(''); setPage(1);
  };
  const activeFilterCount = [statusFilter !== 'all', categoryFilter !== 'all', deptFilter !== 'all', !!dateFrom, !!dateTo].filter(Boolean).length;

  const stats = useMemo(() => ({
    total: allContracts.length,
    active: allContracts.filter((c) => c.status === 'ACTIVE').length,
    pending: allContracts.filter((c) => ['UNDER_REVIEW', 'PENDING_APPROVAL'].includes(c.status)).length,
    expiring: allContracts.filter((c) => c.status === 'EXPIRING_SOON').length,
    totalValue: allContracts.reduce((s, c) => s + (Number(c.value) || 0), 0),
  }), [allContracts]);

  const EXPORT_COLUMNS = ['Contract Number', 'Title', 'Owner', 'Department', 'Status', 'Amount', 'Expiry Date'];
  const rowToValues = (c: ContractRow) => [
    c.contractNumber, c.title, ownerName(c), deptName(c), label(c.status), fmtMoney(c.value, c.currency), fmtDate(c.expiryDate),
  ];
  const exportToExcel = useCallback((rows: ContractRow[]) => {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [EXPORT_COLUMNS.map(esc).join(','), ...rows.map((c) => rowToValues(c).map(esc).join(','))].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `contracts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-muted opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-accent" /> : <ArrowDown size={12} className="text-accent" />;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-20 bg-bg-surface rounded-xl" />
        <div className="grid grid-cols-4 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-bg-surface rounded-xl" />)}</div>
        <div className="h-[500px] bg-bg-surface rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* Header */}
      <div className="flex justify-between items-center bg-card p-5 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-primary m-0"><FileText size={24} className="text-accent" /> Contract Registry</h1>
          <p className="text-sm text-muted mt-1">Manage, filter, and export your entire contract portfolio.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => refetch()}><RefreshCw size={14} /></button>
          <Link href="/contracts/new" className="btn btn-primary"><Plus size={16} /> New Contract</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Contracts', value: stats.total, icon: <FileText size={18} />, border: 'border-l-accent', text: 'text-accent' },
          { label: 'Active', value: stats.active, icon: <CheckCircle size={18} />, border: 'border-l-success', text: 'text-success' },
          { label: 'Pending Review', value: stats.pending, icon: <Clock size={18} />, border: 'border-l-warning', text: 'text-warning' },
          { label: 'Expiring Soon', value: stats.expiring, icon: <AlertTriangle size={18} />, border: 'border-l-danger', text: 'text-danger' },
          { label: 'Portfolio Value', value: `${stats.totalValue.toLocaleString()} ETB`, icon: <TrendingUp size={18} />, border: 'border-l-info', text: 'text-info' },
        ].map((s, i) => (
          <div key={i} className={`card card-sm border-l-4 ${s.border}`}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-muted text-[10px] font-bold uppercase tracking-wider">{s.label}</span>
              <span className={`${s.text} opacity-70`}>{s.icon}</span>
            </div>
            <div className="text-xl font-bold font-mono text-primary">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter Bar */}
      <div className="card p-0 overflow-hidden border border-border shadow-sm">
        <div className="p-4 border-b border-border bg-bg-surface flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" placeholder="Search by number, title, vendor, or owner..." className="form-control pl-9 w-full" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary"><X size={14} /></button>}
          </div>
          <div className="flex border border-border rounded-lg overflow-hidden bg-bg-input text-xs font-medium">
            {['all', 'ACTIVE', 'UNDER_REVIEW', 'PENDING_APPROVAL', 'EXPIRING_SOON'].map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 whitespace-nowrap transition-colors ${statusFilter === s ? 'bg-accent text-[#3B2718] font-semibold' : 'text-muted hover:bg-bg-surface'}`}>
                {s === 'all' ? 'All' : label(s)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn btn-ghost btn-sm border ${showFilters ? 'border-accent text-accent' : 'border-border'}`}>
            <Filter size={14} /> Filters {activeFilterCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent text-[#3B2718] text-[10px] font-bold">{activeFilterCount}</span>}
          </button>
          <div className="flex-1" />
          <div className="flex border border-border rounded-lg overflow-hidden bg-bg-input">
            <button onClick={() => setViewMode('table')} className={`p-1.5 ${viewMode === 'table' ? 'bg-bg-surface shadow text-primary' : 'text-muted'}`}><List size={16} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 ${viewMode === 'grid' ? 'bg-bg-surface shadow text-primary' : 'text-muted'}`}><Grid3X3 size={16} /></button>
          </div>
          <button onClick={() => exportToExcel(filtered)} disabled={filtered.length === 0} className="btn btn-ghost btn-sm border border-border disabled:opacity-40"><FileSpreadsheet size={14} /> Excel</button>
          <button onClick={() => window.print()} disabled={filtered.length === 0} className="btn btn-ghost btn-sm border border-border disabled:opacity-40"><Download size={14} /> Print</button>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-border bg-bg-card grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">Category</label>
              <select className="form-control text-sm" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
                <option value="all">All Categories</option>
                {[...new Set(allContracts.map((c) => c.category))].map((k) => <option key={k} value={k}>{catLabel(k)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">Department</label>
              <select className="form-control text-sm" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}>
                <option value="all">All Departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">Created From</label>
              <input type="date" className="form-control text-sm" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5 block">Created To</label>
              <input type="date" className="form-control text-sm" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
            </div>
            {activeFilterCount > 0 && (
              <div className="col-span-full flex justify-end">
                <button onClick={clearFilters} className="btn btn-ghost btn-sm text-danger"><X size={14} /> Clear All Filters</button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-input text-muted text-[11px] uppercase tracking-wider font-bold border-b border-border">
                <tr>
                  <th className="py-3 px-3 cursor-pointer select-none" onClick={() => toggleSort('contractNumber')}><span className="flex items-center gap-1.5">Contract # <SortIcon field="contractNumber" /></span></th>
                  <th className="py-3 px-3 cursor-pointer select-none" onClick={() => toggleSort('title')}><span className="flex items-center gap-1.5">Title <SortIcon field="title" /></span></th>
                  <th className="py-3 px-3">Owner</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3 cursor-pointer select-none" onClick={() => toggleSort('status')}><span className="flex items-center gap-1.5">Status <SortIcon field="status" /></span></th>
                  <th className="py-3 px-3 cursor-pointer select-none text-right" onClick={() => toggleSort('value')}><span className="flex items-center gap-1.5 justify-end">Amount <SortIcon field="value" /></span></th>
                  <th className="py-3 px-3 cursor-pointer select-none" onClick={() => toggleSort('expiryDate')}><span className="flex items-center gap-1.5">Expiry <SortIcon field="expiryDate" /></span></th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginated.map((c) => (
                  <tr key={c.id} className="hover:bg-card-hover transition-colors">
                    <td className="py-3 px-3"><Link href={`/contracts/${c.id}`} className="text-accent font-mono text-xs font-bold hover:underline">{c.contractNumber}</Link></td>
                    <td className="py-3 px-3 max-w-[240px]">
                      <div className="font-semibold text-primary truncate">{c.title}</div>
                      <div className="text-[11px] text-muted mt-0.5 flex items-center gap-1"><Tag size={10} /> {catLabel(c.category)}</div>
                    </td>
                    <td className="py-3 px-3 text-secondary text-xs">{ownerName(c)}</td>
                    <td className="py-3 px-3"><span className="flex items-center gap-1.5 text-xs font-medium"><Building2 size={12} className="text-muted" /> {deptName(c)}</span></td>
                    <td className="py-3 px-3"><span className={`${statusBadge(c.status)} text-[10px] font-bold`}>{label(c.status)}</span></td>
                    <td className="py-3 px-3 text-right font-mono text-xs font-medium">{fmtMoney(c.value, c.currency)}</td>
                    <td className="py-3 px-3 text-xs text-secondary"><span className="flex items-center gap-1"><Calendar size={11} className="text-muted" /> {fmtDate(c.expiryDate)}</span></td>
                    <td className="py-3 px-3 text-right"><Link href={`/contracts/${c.id}`} className="btn btn-ghost btn-sm p-1.5"><Eye size={16} className="text-muted" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {paginated.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-bg-input flex items-center justify-center mb-4"><FileText size={36} className="text-muted opacity-40" /></div>
                <h3 className="text-lg font-bold text-primary mb-1">No contracts found</h3>
                <p className="text-sm text-muted mb-4 max-w-sm">Try adjusting your search or filters, or create a new contract.</p>
                <div className="flex gap-3">
                  <button onClick={clearFilters} className="btn btn-secondary btn-sm">Clear Filters</button>
                  <Link href="/contracts/new" className="btn btn-primary btn-sm"><Plus size={14} /> Create Contract</Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginated.map((c) => (
              <Link key={c.id} href={`/contracts/${c.id}`} className="block border border-border rounded-xl p-4 hover:border-accent/40 hover:shadow-md transition-all bg-bg-card group">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-xs text-accent font-bold">{c.contractNumber}</span>
                  <span className={`${statusBadge(c.status)} text-[10px] font-bold`}>{label(c.status)}</span>
                </div>
                <h4 className="font-bold text-sm text-primary mb-2 group-hover:text-accent transition-colors line-clamp-2">{c.title}</h4>
                <div className="flex flex-col gap-1.5 text-xs text-secondary">
                  <span className="flex items-center gap-1.5"><Building2 size={12} className="text-muted" />{deptName(c)}</span>
                  <span className="flex items-center gap-1.5"><Tag size={12} className="text-muted" />{catLabel(c.category)}</span>
                  <span className="flex items-center gap-1.5"><Calendar size={12} className="text-muted" />Expires: {fmtDate(c.expiryDate)}</span>
                </div>
                {c.value != null && <div className="mt-3 pt-3 border-t border-border text-right font-mono text-sm font-bold text-primary">{fmtMoney(c.value, c.currency)}</div>}
              </Link>
            ))}
            {paginated.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <FileText size={40} className="text-muted opacity-30 mb-3" />
                <p className="text-muted font-medium">No contracts match your criteria.</p>
                <button onClick={clearFilters} className="btn btn-secondary btn-sm mt-3">Clear Filters</button>
              </div>
            )}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-bg-surface flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-muted">
              <span>Showing <strong className="text-primary">{(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)}</strong> of <strong className="text-primary">{filtered.length}</strong></span>
              <select className="form-control py-1 px-2 text-xs w-auto" value={perPage} onChange={(e) => { setPerPage(+e.target.value); setPage(1); }}>
                {ITEMS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n} / page</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="btn btn-ghost btn-sm p-1.5 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <span className="px-3 text-xs text-muted">Page {page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="btn btn-ghost btn-sm p-1.5 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
