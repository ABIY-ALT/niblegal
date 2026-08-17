'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Plus, Download, ChevronLeft, ChevronRight, FileText, Filter, X,
  Grid3X3, List, ArrowUpDown, ArrowUp, ArrowDown, Eye, Calendar, Building2,
  Tag, TrendingUp, Clock, CheckCircle, AlertTriangle, RefreshCw, Home, Inbox,
} from 'lucide-react';
import { format } from 'date-fns';
import { statusLabel, statusBadgeClass, categoryLabel } from '@/lib/contractStatus';

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

interface ContractsResponse {
  data: ContractRow[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

const fmtDate = (d: string | null) => (d ? format(new Date(d), 'MMM d, yyyy') : '—');
const fmtMoney = (v: string | number | null, cur: string | null) =>
  v == null ? '—' : `${Number(v).toLocaleString()} ${cur ?? 'ETB'}`;
const ownerName = (c: ContractRow) => (c.requester ? `${c.requester.firstName} ${c.requester.lastName}` : '—');
const deptName = (c: ContractRow) => c.requestingDepartment?.name ?? '—';

/* The API clamps `limit` to 100 (src/app/api/contracts/route.ts), so asking for
   more silently returns 100. Request exactly the cap and use meta.total — which
   is a real server-side count — so the portfolio figure stays truthful even when
   the fetched page is only part of the register. */
const FETCH_LIMIT = 100;

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];
type SortField = 'contractNumber' | 'title' | 'status' | 'value' | 'expiryDate' | 'createdAt';
type SortDir = 'asc' | 'desc';

const QUICK_STATUSES = ['all', 'ACTIVE', 'UNDER_REVIEW', 'PENDING_APPROVAL', 'EXPIRING_SOON'];

export interface ContractsListViewProps {
  title: string;
  subtitle: string;
  scope?: 'mine' | 'assigned';
  lockedStatuses?: string[];
  emptyLabel?: string;
}

export default function ContractsListView({
  title, subtitle, scope, lockedStatuses, emptyLabel,
}: ContractsListViewProps) {
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

  /* Seed the search box from ?q= (the hub page's search sends users here).
     Read after mount rather than during render so server and client markup
     agree on the first paint. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setSearch(q);
  }, []);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<ContractsResponse>({
    queryKey: ['contracts-list', scope ?? 'all'],
    queryFn: async () => {
      const res = await fetch(`/api/contracts?limit=${FETCH_LIMIT}${scope ? `&scope=${scope}` : ''}`);
      if (!res.ok) throw new Error(`Failed to load contracts (${res.status})`);
      return res.json();
    },
  });

  const allContracts = useMemo(() => {
    const rows = data?.data ?? [];
    return lockedStatuses ? rows.filter((c) => lockedStatuses.includes(c.status)) : rows;
  }, [data, lockedStatuses]);

  const serverTotal = data?.meta?.total ?? allContracts.length;
  // Only meaningful on the unfiltered register; a locked-status view has already
  // narrowed the rows client-side, so the server total does not describe it.
  const truncated = !lockedStatuses && serverTotal > allContracts.length;

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
        c.counterparty.toLowerCase().includes(q) || ownerName(c).toLowerCase().includes(q),
      );
    }
    if (!lockedStatuses && statusFilter !== 'all') result = result.filter((c) => c.status === statusFilter);
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
  }, [allContracts, search, statusFilter, categoryFilter, deptFilter, dateFrom, dateTo, sortField, sortDir, lockedStatuses]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Keep the cursor inside range when filters shrink the result set.
  useEffect(() => { if (page > totalPages) setPage(1); }, [page, totalPages]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const clearFilters = () => {
    setStatusFilter('all'); setCategoryFilter('all'); setDeptFilter('all');
    setDateFrom(''); setDateTo(''); setSearch(''); setPage(1);
  };

  const activeFilterCount = [
    !lockedStatuses && statusFilter !== 'all',
    categoryFilter !== 'all', deptFilter !== 'all', !!dateFrom, !!dateTo,
  ].filter(Boolean).length;

  const stats = useMemo(() => ({
    total: allContracts.length,
    active: allContracts.filter((c) => c.status === 'ACTIVE').length,
    pending: allContracts.filter((c) => ['UNDER_REVIEW', 'PENDING_APPROVAL'].includes(c.status)).length,
    expiring: allContracts.filter((c) => c.status === 'EXPIRING_SOON').length,
    totalValue: allContracts.reduce((s, c) => s + (Number(c.value) || 0), 0),
  }), [allContracts]);

  const exportToCsv = useCallback((rows: ContractRow[]) => {
    const columns = ['Contract Number', 'Title', 'Owner', 'Department', 'Status', 'Amount', 'Expiry Date'];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      columns.map(esc).join(','),
      ...rows.map((c) => [
        c.contractNumber, c.title, ownerName(c), deptName(c),
        statusLabel(c.status), fmtMoney(c.value, c.currency), fmtDate(c.expiryDate),
      ].map(esc).join(',')),
    ].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="cm-sort-icon" />;
    return sortDir === 'asc'
      ? <ArrowUp className="cm-sort-icon active" />
      : <ArrowDown className="cm-sort-icon active" />;
  };

  const kpis = [
    { label: 'Total', value: truncated ? serverTotal.toLocaleString() : stats.total.toLocaleString(), icon: <FileText size={19} />, tone: 'accent', meta: truncated ? `${stats.total} loaded` : 'In this view' },
    { label: 'Active', value: stats.active.toLocaleString(), icon: <CheckCircle size={19} />, tone: 'success', meta: 'In effect' },
    { label: 'Pending', value: stats.pending.toLocaleString(), icon: <Clock size={19} />, tone: 'warning', meta: 'Review or approval' },
    { label: 'Expiring', value: stats.expiring.toLocaleString(), icon: <AlertTriangle size={19} />, tone: 'danger', meta: 'Needs renewal' },
    { label: 'Portfolio Value', value: `${stats.totalValue.toLocaleString()} ETB`, icon: <TrendingUp size={19} />, tone: 'info', meta: 'Loaded contracts' },
  ];

  const emptyHeadline = emptyLabel ?? 'No contracts found';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="enterprise-page">
        <div className="skeleton" style={{ height: 96, borderRadius: 'var(--radius-lg)' }} />
        <div className="enterprise-kpi-grid cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 460, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="enterprise-page">
        <div className="alert alert-danger">
          Could not load contracts.
          <button className="btn btn-sm btn-ghost" style={{ marginLeft: 10 }} onClick={() => refetch()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="enterprise-page">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div style={{ minWidth: 0 }}>
            <nav className="enterprise-kicker" aria-label="Breadcrumb">
              <Link href="/dashboard" className="enterprise-id" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Home size={11} /> Home
              </Link>
              <ChevronRight size={12} style={{ color: 'rgba(247,245,242,0.45)' }} />
              <Link href="/contracts" className="enterprise-id" style={{ textDecoration: 'none' }}>Contracts</Link>
            </nav>
            <h1 className="enterprise-title">{title}</h1>
            <p className="enterprise-subtitle">{subtitle}</p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => refetch()}
              className="btn btn-ghost btn-sm"
              title="Refresh"
              aria-label="Refresh contracts"
              disabled={isFetching}
            >
              <RefreshCw size={14} style={isFetching ? { animation: 'spin 0.8s linear infinite' } : undefined} />
            </button>
            <Link href="/contracts/new" className="btn btn-primary btn-sm">
              <Plus size={14} /> Create Contract
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="enterprise-kpi-grid cols-5">
        {kpis.map((k) => (
          <div key={k.label} className={`enterprise-kpi tone-${k.tone}`}>
            <div className="enterprise-kpi-head">
              <div style={{ minWidth: 0 }}>
                <div className="enterprise-kpi-label">{k.label}</div>
                <div className="enterprise-kpi-number" style={{ fontSize: k.label === 'Portfolio Value' ? 20 : undefined }}>
                  {k.value}
                </div>
              </div>
              <div className={`enterprise-kpi-icon tone-${k.tone}`}>{k.icon}</div>
            </div>
            <div className="enterprise-kpi-meta">{k.meta}</div>
          </div>
        ))}
      </div>

      {truncated && (
        <div className="alert alert-warning" style={{ marginBottom: 0 }}>
          Showing the {allContracts.length} most recent of {serverTotal.toLocaleString()} contracts.
          Filters and sorting apply to the loaded set — narrow by status from the
          register sections for a complete view.
        </div>
      )}

      {/* ── Registry panel ───────────────────────────────────────────────── */}
      <div className="enterprise-panel">

        {/* Toolbar */}
        <div className="cm-toolbar">
          <div className="cm-search">
            <Search />
            <input
              type="search"
              placeholder="Search number, title, counterparty or owner…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              aria-label="Search contracts"
            />
            {search && (
              <button className="cm-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          {!lockedStatuses && (
            <div className="cm-segment">
              {QUICK_STATUSES.map((st) => {
                const count = st === 'all'
                  ? allContracts.length
                  : allContracts.filter((c) => c.status === st).length;
                return (
                  <button
                    key={st}
                    className={statusFilter === st ? 'active' : ''}
                    onClick={() => { setStatusFilter(st); setPage(1); }}
                  >
                    {st === 'all' ? 'All' : statusLabel(st)}
                    <span className="cm-count">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="cm-toolbar-group">
            <button
              className={`btn btn-sm ${showFilters || activeFilterCount ? 'btn-secondary' : 'btn-ghost'}`}
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
            >
              <Filter size={14} /> Filters
              {activeFilterCount > 0 && <span className="cm-count">{activeFilterCount}</span>}
            </button>

            <div className="cm-segment" role="group" aria-label="View mode">
              <button
                className={viewMode === 'table' ? 'active' : ''}
                onClick={() => setViewMode('table')}
                aria-label="Table view"
                aria-pressed={viewMode === 'table'}
              >
                <List size={15} />
              </button>
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                aria-label="Card view"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid3X3 size={15} />
              </button>
            </div>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => exportToCsv(filtered)}
              disabled={filtered.length === 0}
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Filter drawer */}
        {showFilters && (
          <div className="cm-filters">
            <div className="cm-filter-field">
              <label htmlFor="cm-category">Category</label>
              <select
                id="cm-category"
                className="form-control"
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All categories</option>
                {[...new Set(allContracts.map((c) => c.category))].map((k) => (
                  <option key={k} value={k}>{categoryLabel(k)}</option>
                ))}
              </select>
            </div>
            <div className="cm-filter-field">
              <label htmlFor="cm-dept">Department</label>
              <select
                id="cm-dept"
                className="form-control"
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="cm-filter-field">
              <label htmlFor="cm-from">Created from</label>
              <input
                id="cm-from" type="date" className="form-control"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
            </div>
            <div className="cm-filter-field">
              <label htmlFor="cm-to">Created to</label>
              <input
                id="cm-to" type="date" className="form-control"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
            </div>
            {activeFilterCount > 0 && (
              <div className="cm-filters-footer">
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  <X size={14} /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {paginated.length === 0 ? (
          <div className="empty-state" style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{
              width: 66, height: 66, margin: '0 auto 16px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', borderRadius: 20,
              background: 'var(--bg-input)', border: '1px solid var(--border)',
            }}>
              <Inbox size={30} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{emptyHeadline}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 380, margin: '0 auto 18px' }}>
              {activeFilterCount > 0 || search
                ? 'No contracts match the current search and filters.'
                : 'Nothing to show here yet.'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {(activeFilterCount > 0 || search) && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
              )}
              <Link href="/contracts/new" className="btn btn-primary btn-sm">
                <Plus size={14} /> Create Contract
              </Link>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          /* ── Table ──────────────────────────────────────────────────── */
          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleSort('contractNumber')}>
                    <span className="cm-th-inner">Contract # <SortIcon field="contractNumber" /></span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('title')}>
                    <span className="cm-th-inner">Title <SortIcon field="title" /></span>
                  </th>
                  <th>Owner</th>
                  <th>Department</th>
                  <th className="sortable" onClick={() => toggleSort('status')}>
                    <span className="cm-th-inner">Status <SortIcon field="status" /></span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('value')}>
                    <span className="cm-th-inner right">Amount <SortIcon field="value" /></span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('expiryDate')}>
                    <span className="cm-th-inner">Expiry <SortIcon field="expiryDate" /></span>
                  </th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/contracts/${c.id}`} className="cm-ref">{c.contractNumber}</Link>
                    </td>
                    <td style={{ maxWidth: 320 }}>
                      <div className="cm-cell-strong">{c.title}</div>
                      <div className="cm-cell-sub"><Tag /> {categoryLabel(c.category)}</div>
                    </td>
                    <td>
                      <span className="cm-owner">
                        <span className="cm-avatar">{ownerName(c).charAt(0)}</span>
                        {ownerName(c)}
                      </span>
                    </td>
                    <td><span className="cm-muted-cell"><Building2 /> {deptName(c)}</span></td>
                    <td><span className={statusBadgeClass(c.status)}>{statusLabel(c.status)}</span></td>
                    <td className="cm-num">{fmtMoney(c.value, c.currency)}</td>
                    <td><span className="cm-muted-cell"><Calendar /> {fmtDate(c.expiryDate)}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/contracts/${c.id}`}
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label={`Open ${c.contractNumber}`}
                      >
                        <Eye size={15} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── Card grid ──────────────────────────────────────────────── */
          <div className="cm-card-grid">
            {paginated.map((c) => (
              <Link key={c.id} href={`/contracts/${c.id}`} className="cm-card" style={{ textDecoration: 'none' }}>
                <div className="cm-card-head">
                  <span className="cm-ref">{c.contractNumber}</span>
                  <span className={statusBadgeClass(c.status)}>{statusLabel(c.status)}</span>
                </div>
                <div className="cm-card-title">{c.title}</div>
                <div className="cm-card-meta">
                  <span className="cm-muted-cell"><Building2 /> {deptName(c)}</span>
                  <span className="cm-muted-cell"><Tag /> {categoryLabel(c.category)}</span>
                  <span className="cm-muted-cell"><Calendar /> {fmtDate(c.expiryDate)}</span>
                </div>
                <div className="cm-card-foot">
                  <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                    Value
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {fmtMoney(c.value, c.currency)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="cm-pagination">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span>
                Showing <strong style={{ color: 'var(--text-primary)' }}>
                  {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)}
                </strong> of <strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong>
              </span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                aria-label="Rows per page"
              >
                {ITEMS_PER_PAGE_OPTIONS.map((n) => <option key={n} value={n}>{n} rows</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="cm-page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="cm-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
