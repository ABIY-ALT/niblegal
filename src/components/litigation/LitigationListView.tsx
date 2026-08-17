'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Plus, Download, ChevronLeft, ChevronRight, Gavel, Filter, X,
  Grid3X3, List, ArrowUpDown, ArrowUp, ArrowDown, Eye, Calendar, Scale,
  TrendingUp, AlertTriangle, CheckCircle, RefreshCw, Home, Inbox, UserRound,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  caseStatusLabel, caseStatusBadgeClass, caseCategoryLabel,
  riskLabel, riskBadgeClass,
} from '@/lib/litigationStatus';

interface CaseRow {
  id: string;
  caseNumber: string;
  title: string;
  category: string;
  status: string;
  riskLevel: string;
  bankRole: string;
  opposingParty: string;
  court: string | null;
  exposureAmount: string | number | null;
  currency: string | null;
  createdAt: string;
  assignedOfficer?: { firstName: string; lastName: string } | null;
  requestingDepartment?: { name: string } | null;
  hearings?: { scheduledAt: string }[];
}

interface CasesResponse {
  data: CaseRow[];
  meta?: { total: number; page: number; limit: number; totalPages: number };
}

const fmtDate = (d: string | null | undefined) => (d ? format(new Date(d), 'MMM d, yyyy') : '—');
const fmtMoney = (v: string | number | null, cur: string | null) =>
  v == null ? '—' : `${Number(v).toLocaleString()} ${cur ?? 'ETB'}`;
const officerName = (c: CaseRow) =>
  c.assignedOfficer ? `${c.assignedOfficer.firstName} ${c.assignedOfficer.lastName}` : 'Unassigned';
const nextHearing = (c: CaseRow) => c.hearings?.[0]?.scheduledAt ?? null;

/** Matches the server-side cap in src/app/api/litigation/route.ts. */
const FETCH_LIMIT = 200;

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50];
const QUICK_STATUSES = ['all', 'ACTIVE', 'PENDING', 'ON_HOLD'];
const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

type SortField = 'caseNumber' | 'title' | 'status' | 'riskLevel' | 'exposureAmount' | 'createdAt';
type SortDir = 'asc' | 'desc';

export interface LitigationListViewProps {
  title: string;
  subtitle: string;
  scope?: 'mine' | 'assigned';
  lockedStatuses?: string[];
  emptyLabel?: string;
}

export default function LitigationListView({
  title, subtitle, scope, lockedStatuses, emptyLabel,
}: LitigationListViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  /* Seed from ?q= (the hub's search sends users here). Read after mount so the
     server and client agree on the first paint. */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setSearch(q);
  }, []);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<CasesResponse>({
    queryKey: ['litigation-list', scope ?? 'all'],
    queryFn: async () => {
      const res = await fetch(`/api/litigation?limit=${FETCH_LIMIT}${scope ? `&scope=${scope}` : ''}`);
      if (!res.ok) throw new Error(`Failed to load cases (${res.status})`);
      return res.json();
    },
  });

  const allCases = useMemo(() => {
    const rows = data?.data ?? [];
    return lockedStatuses ? rows.filter((c) => lockedStatuses.includes(c.status)) : rows;
  }, [data, lockedStatuses]);

  const serverTotal = data?.meta?.total ?? allCases.length;
  const truncated = !lockedStatuses && serverTotal > allCases.length;

  const filtered = useMemo(() => {
    let result = [...allCases];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.caseNumber.toLowerCase().includes(q) || c.title.toLowerCase().includes(q) ||
        c.opposingParty.toLowerCase().includes(q) || officerName(c).toLowerCase().includes(q));
    }
    if (!lockedStatuses && statusFilter !== 'all') result = result.filter((c) => c.status === statusFilter);
    if (categoryFilter !== 'all') result = result.filter((c) => c.category === categoryFilter);
    if (riskFilter !== 'all') result = result.filter((c) => c.riskLevel === riskFilter);

    result.sort((a, b) => {
      let aVal: string | number = '', bVal: string | number = '';
      switch (sortField) {
        case 'caseNumber': aVal = a.caseNumber; bVal = b.caseNumber; break;
        case 'title': aVal = a.title; bVal = b.title; break;
        case 'status': aVal = a.status; bVal = b.status; break;
        case 'riskLevel': aVal = a.riskLevel; bVal = b.riskLevel; break;
        case 'exposureAmount': aVal = Number(a.exposureAmount) || 0; bVal = Number(b.exposureAmount) || 0; break;
        default: aVal = a.createdAt; bVal = b.createdAt;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return result;
  }, [allCases, search, statusFilter, categoryFilter, riskFilter, sortField, sortDir, lockedStatuses]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => { if (page > totalPages) setPage(1); }, [page, totalPages]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const clearFilters = () => {
    setStatusFilter('all'); setCategoryFilter('all'); setRiskFilter('all');
    setSearch(''); setPage(1);
  };

  const activeFilterCount = [
    !lockedStatuses && statusFilter !== 'all', categoryFilter !== 'all', riskFilter !== 'all',
  ].filter(Boolean).length;

  const stats = useMemo(() => ({
    total: allCases.length,
    active: allCases.filter((c) => c.status === 'ACTIVE').length,
    highRisk: allCases.filter((c) => ['HIGH', 'CRITICAL'].includes(c.riskLevel)).length,
    totalExposure: allCases.reduce((s, c) => s + (Number(c.exposureAmount) || 0), 0),
  }), [allCases]);

  const exportToCsv = useCallback((rows: CaseRow[]) => {
    const columns = ['Case Number', 'Title', 'Officer', 'Category', 'Status', 'Risk', 'Exposure', 'Court'];
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [
      columns.map(esc).join(','),
      ...rows.map((c) => [
        c.caseNumber, c.title, officerName(c), caseCategoryLabel(c.category),
        caseStatusLabel(c.status), riskLabel(c.riskLevel),
        fmtMoney(c.exposureAmount, c.currency), c.court ?? '—',
      ].map(esc).join(',')),
    ].join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `litigation-cases-${new Date().toISOString().slice(0, 10)}.csv`;
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
    { label: 'Total Cases', value: (truncated ? serverTotal : stats.total).toLocaleString(), icon: <Scale size={19} />, tone: 'accent', meta: truncated ? `${stats.total} loaded` : 'In this view' },
    { label: 'Active', value: stats.active.toLocaleString(), icon: <CheckCircle size={19} />, tone: 'success', meta: 'Currently open' },
    { label: 'High Risk', value: stats.highRisk.toLocaleString(), icon: <AlertTriangle size={19} />, tone: 'danger', meta: 'High or critical' },
    { label: 'Total Exposure', value: `${stats.totalExposure.toLocaleString()} ETB`, icon: <TrendingUp size={19} />, tone: 'info', meta: 'Loaded cases' },
  ];

  if (isLoading) {
    return (
      <div className="enterprise-page">
        <div className="skeleton" style={{ height: 96, borderRadius: 'var(--radius-lg)' }} />
        <div className="enterprise-kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 460, borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="enterprise-page">
        <div className="alert alert-danger">
          Could not load litigation cases.
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
              <Link href="/litigation" className="enterprise-id" style={{ textDecoration: 'none' }}>Litigation</Link>
            </nav>
            <h1 className="enterprise-title">{title}</h1>
            <p className="enterprise-subtitle">{subtitle}</p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh"
              aria-label="Refresh cases"
            >
              <RefreshCw size={14} style={isFetching ? { animation: 'spin 0.8s linear infinite' } : undefined} />
            </button>
            <Link href="/litigation/new" className="btn btn-primary btn-sm">
              <Plus size={14} /> New Case File
            </Link>
          </div>
        </div>
      </div>

      {/* ── KPI strip ────────────────────────────────────────────────────── */}
      <div className="enterprise-kpi-grid">
        {kpis.map((k) => (
          <div key={k.label} className={`enterprise-kpi tone-${k.tone}`}>
            <div className="enterprise-kpi-head">
              <div style={{ minWidth: 0 }}>
                <div className="enterprise-kpi-label">{k.label}</div>
                <div className="enterprise-kpi-number" style={{ fontSize: k.label === 'Total Exposure' ? 20 : undefined }}>
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
          Showing the {allCases.length} most recent of {serverTotal.toLocaleString()} cases.
          Filters and sorting apply to the loaded set.
        </div>
      )}

      {/* ── Case register ────────────────────────────────────────────────── */}
      <div className="enterprise-panel">

        {/* Toolbar */}
        <div className="cm-toolbar">
          <div className="cm-search">
            <Search />
            <input
              type="search"
              placeholder="Search case number, title, opposing party or officer…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              aria-label="Search cases"
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
                  ? allCases.length
                  : allCases.filter((c) => c.status === st).length;
                return (
                  <button
                    key={st}
                    className={statusFilter === st ? 'active' : ''}
                    onClick={() => { setStatusFilter(st); setPage(1); }}
                  >
                    {st === 'all' ? 'All' : caseStatusLabel(st)}
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
              <label htmlFor="lit-category">Category</label>
              <select
                id="lit-category" className="form-control"
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All categories</option>
                {[...new Set(allCases.map((c) => c.category))].map((k) => (
                  <option key={k} value={k}>{caseCategoryLabel(k)}</option>
                ))}
              </select>
            </div>
            <div className="cm-filter-field">
              <label htmlFor="lit-risk">Risk level</label>
              <select
                id="lit-risk" className="form-control"
                value={riskFilter}
                onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
              >
                <option value="all">All risk levels</option>
                {RISK_LEVELS.map((r) => <option key={r} value={r}>{riskLabel(r)}</option>)}
              </select>
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
              <Gavel size={28} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              {emptyLabel ?? 'No cases found'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 380, margin: '0 auto 18px' }}>
              {activeFilterCount > 0 || search
                ? 'No cases match the current search and filters.'
                : 'Nothing to show here yet.'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {(activeFilterCount > 0 || search) && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
              )}
              <Link href="/litigation/new" className="btn btn-primary btn-sm">
                <Plus size={14} /> New Case File
              </Link>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          /* ── Table ──────────────────────────────────────────────────── */
          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleSort('caseNumber')}>
                    <span className="cm-th-inner">Case # <SortIcon field="caseNumber" /></span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('title')}>
                    <span className="cm-th-inner">Case <SortIcon field="title" /></span>
                  </th>
                  <th>Officer</th>
                  <th className="sortable" onClick={() => toggleSort('riskLevel')}>
                    <span className="cm-th-inner">Risk <SortIcon field="riskLevel" /></span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('status')}>
                    <span className="cm-th-inner">Status <SortIcon field="status" /></span>
                  </th>
                  <th className="sortable" onClick={() => toggleSort('exposureAmount')}>
                    <span className="cm-th-inner right">Exposure <SortIcon field="exposureAmount" /></span>
                  </th>
                  <th>Next Hearing</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr key={c.id}>
                    <td><Link href={`/litigation/${c.id}`} className="cm-ref">{c.caseNumber}</Link></td>
                    <td style={{ maxWidth: 300 }}>
                      <div className="cm-cell-strong">{c.title}</div>
                      <div className="cm-cell-sub"><Scale /> {caseCategoryLabel(c.category)} · v. {c.opposingParty}</div>
                    </td>
                    <td>
                      <span className="cm-owner">
                        <span className="cm-avatar">{officerName(c).charAt(0)}</span>
                        {officerName(c)}
                      </span>
                    </td>
                    <td><span className={riskBadgeClass(c.riskLevel)}>{riskLabel(c.riskLevel)}</span></td>
                    <td><span className={caseStatusBadgeClass(c.status)}>{caseStatusLabel(c.status)}</span></td>
                    <td className="cm-num">{fmtMoney(c.exposureAmount, c.currency)}</td>
                    <td><span className="cm-muted-cell"><Calendar /> {fmtDate(nextHearing(c))}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/litigation/${c.id}`}
                        className="btn btn-ghost btn-sm btn-icon"
                        aria-label={`Open ${c.caseNumber}`}
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
              <Link key={c.id} href={`/litigation/${c.id}`} className="cm-card" style={{ textDecoration: 'none' }}>
                <div className="cm-card-head">
                  <span className="cm-ref">{c.caseNumber}</span>
                  <span className={caseStatusBadgeClass(c.status)}>{caseStatusLabel(c.status)}</span>
                </div>
                <div className="cm-card-title">{c.title}</div>
                <div className="cm-card-meta">
                  <span className="cm-muted-cell"><UserRound /> {officerName(c)}</span>
                  <span className="cm-muted-cell"><Scale /> {caseCategoryLabel(c.category)}</span>
                  <span className="cm-muted-cell"><Calendar /> Next hearing: {fmtDate(nextHearing(c))}</span>
                </div>
                <div className="cm-card-foot">
                  <span className={riskBadgeClass(c.riskLevel)}>{riskLabel(c.riskLevel)} risk</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {fmtMoney(c.exposureAmount, c.currency)}
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
