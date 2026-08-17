'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import {
  Search, Plus, ChevronLeft, ChevronRight, FileText, FileSpreadsheet,
  Filter, X, Home, Inbox, Users, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { StatusBadge } from './StatusBadge';
import { PriorityBadge } from './PriorityBadge';
import { SlaCountdown } from './SlaCountdown';
import type { LegalRequestListItem, LegalRequestCategoryOption, UserRef } from '@/types/advisory';

export type RequestScope =
  | 'all' | 'my' | 'assigned' | 'drafts' | 'review' | 'approval' | 'approved' | 'dispatched' | 'closed';

interface Props {
  scope: RequestScope;
  title: string;
  subtitle?: string;
  emptyMessage?: string;
  showFilters?: boolean;
  showBulkActions?: boolean;
  showNewButton?: boolean;
}

const ALL_STATUSES = [
  'DRAFT', 'SUBMITTED', 'VALIDATED', 'ASSIGNED', 'DRAFTING', 'REVIEW', 'RETURNED',
  'PENDING_APPROVAL', 'APPROVED', 'DISPATCHED', 'CLOSED', 'ARCHIVED', 'REJECTED', 'ESCALATED',
];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'];

const prettyEnum = (v: string) =>
  v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

function buildScopeParams(scope: RequestScope, userId?: string): Record<string, string> {
  switch (scope) {
    case 'my':
      return userId ? { requesterId: userId } : {};
    case 'assigned':
      return userId ? { assigneeId: userId, excludeClosed: '1' } : {};
    case 'drafts':
      return userId ? { assigneeId: userId, status: 'DRAFTING' } : {};
    case 'review':
      return { status: 'REVIEW' };
    case 'approval':
      return { status: 'PENDING_APPROVAL' };
    case 'approved':
      return { status: 'APPROVED' };
    case 'dispatched':
      return { status: 'DISPATCHED' };
    case 'closed':
      return { statusIn: 'CLOSED,ARCHIVED' };
    default:
      return {};
  }
}

export function RequestTable({
  scope, title, subtitle, emptyMessage, showFilters, showBulkActions, showNewButton,
}: Props) {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [reassigning, setReassigning] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'xlsx' | null>(null);
  const limit = 15;

  /* The query key includes the search term, so binding it directly to the input
     fired a fresh request on every keystroke. Debounce before it reaches the key. */
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const needsUser = scope === 'my' || scope === 'assigned' || scope === 'drafts';
  const scopeParams = useMemo(() => buildScopeParams(scope, currentUser?.id), [scope, currentUser?.id]);

  const { data: categories } = useQuery({
    queryKey: ['advisory-categories'],
    queryFn: async () => {
      const res = await fetch('/api/advisory/categories');
      if (!res.ok) throw new Error('Failed to load categories');
      return (await res.json()).data as LegalRequestCategoryOption[];
    },
    enabled: !!showFilters,
  });

  const { data: officers } = useQuery({
    queryKey: ['advisory-officers'],
    queryFn: async () => {
      const res = await fetch('/api/advisory/officers');
      if (!res.ok) throw new Error('Failed to load officers');
      return (await res.json()).data as UserRef[];
    },
    enabled: !!showBulkActions,
  });

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['advisory-requests', scope, page, debouncedSearch, statusFilter, categoryFilter, priorityFilter, currentUser?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), ...scopeParams });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      const res = await fetch(`/api/advisory/requests?${params}`);
      if (!res.ok) throw new Error('Failed to load requests');
      return res.json();
    },
    enabled: !needsUser || !!currentUser?.id,
  });

  const rows: LegalRequestListItem[] = data?.data ?? [];
  const meta = data?.meta as { total: number; page: number; totalPages: number } | undefined;
  const activeFilterCount = [statusFilter, categoryFilter, priorityFilter].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter(''); setCategoryFilter(''); setPriorityFilter('');
    setSearch(''); setPage(1);
  };

  const toggleSelected = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleSelectAll = () =>
    setSelected((prev) =>
      allOnPageSelected
        ? prev.filter((id) => !rows.some((r) => r.id === id))
        : [...new Set([...prev, ...rows.map((r) => r.id)])],
    );

  const handleExport = async (fmt: 'pdf' | 'xlsx') => {
    setExporting(fmt);
    try {
      const params = new URLSearchParams({ format: fmt, ...scopeParams });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (selected.length > 0) params.set('ids', selected.join(','));
      const res = await fetch(`/api/advisory/requests/export?${params}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `legal-requests.${fmt === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  const handleBulkReassign = async (officerId: string) => {
    setReassigning(true);
    try {
      await fetch('/api/advisory/requests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selected, action: 'REASSIGN', officerId }),
      });
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['advisory-requests'] });
    } finally {
      setReassigning(false);
    }
  };

  const columns = useMemo<ColumnDef<LegalRequestListItem>[]>(
    () => [
      ...(showBulkActions
        ? [
            {
              id: 'select',
              header: () => (
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all rows on this page"
                />
              ),
              cell: (info: { row: { original: LegalRequestListItem } }) => (
                <input
                  type="checkbox"
                  checked={selected.includes(info.row.original.id)}
                  onChange={() => toggleSelected(info.row.original.id)}
                  aria-label={`Select ${info.row.original.requestNumber}`}
                />
              ),
            } as ColumnDef<LegalRequestListItem>,
          ]
        : []),
      {
        accessorKey: 'requestNumber',
        header: 'Request ID',
        cell: (info) => (
          <Link href={`/advisory/${info.row.original.id}`} className="cm-ref">
            {info.getValue() as string}
          </Link>
        ),
      },
      {
        accessorKey: 'subject',
        header: 'Subject',
        cell: (info) => (
          <div style={{ maxWidth: 280 }}>
            <div className="cm-cell-strong">{info.getValue() as string}</div>
            <div className="cm-cell-sub">{info.row.original.category.name}</div>
          </div>
        ),
      },
      {
        accessorFn: (r) => r.requestingDepartment.name,
        id: 'department',
        header: 'Requesting Dept.',
        cell: (info) => <span className="cm-muted-cell">{info.getValue() as string}</span>,
      },
      {
        accessorFn: (r) => r.requester,
        id: 'requester',
        header: 'Requested By',
        cell: (info) => {
          const u = info.getValue() as UserRef;
          return (
            <span className="cm-owner">
              <span className="cm-avatar">{u.firstName.charAt(0)}</span>
              {u.firstName} {u.lastName}
            </span>
          );
        },
      },
      {
        accessorFn: (r) => r.assignee,
        id: 'assignee',
        header: 'Assigned Officer',
        cell: (info) => {
          const u = info.getValue() as UserRef | null;
          return u ? (
            <span className="cm-owner">
              <span className="cm-avatar">{u.firstName.charAt(0)}</span>
              {u.firstName} {u.lastName}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
          );
        },
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: (info) => <PriorityBadge priority={info.getValue() as LegalRequestListItem['priority']} />,
      },
      {
        id: 'sla',
        header: 'SLA Status',
        cell: (info) => {
          const r = info.row.original;
          return <SlaCountdown slaDeadline={r.slaDeadline} slaHours={0} status={r.status} slaBreached={r.slaBreached} compact />;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue() as LegalRequestListItem['status']} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted',
        cell: (info) => (
          <span className="cm-muted-cell">{format(new Date(info.getValue() as string), 'MMM d, yyyy')}</span>
        ),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: (info) => {
          const v = info.getValue() as string | null;
          return <span className="cm-muted-cell">{v ? format(new Date(v), 'MMM d, yyyy') : '—'}</span>;
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showBulkActions, selected, allOnPageSelected, rows],
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

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
              <Link href="/advisory" className="enterprise-id" style={{ textDecoration: 'none' }}>Legal Advisory</Link>
            </nav>
            <h1 className="enterprise-title">{title}</h1>
            {subtitle && <p className="enterprise-subtitle">{subtitle}</p>}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => refetch()}
              disabled={isFetching}
              aria-label="Refresh requests"
              title="Refresh"
            >
              <RefreshCw size={14} style={isFetching ? { animation: 'spin 0.8s linear infinite' } : undefined} />
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => handleExport('xlsx')} disabled={exporting !== null}>
              <FileSpreadsheet size={14} /> {exporting === 'xlsx' ? 'Exporting…' : 'Excel'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => handleExport('pdf')} disabled={exporting !== null}>
              <FileText size={14} /> {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
            </button>
            {showNewButton && (
              <Link href="/advisory/new" className="btn btn-primary btn-sm">
                <Plus size={14} /> New Request
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Registry panel ───────────────────────────────────────────────── */}
      <div className="enterprise-panel">

        {/* Toolbar */}
        <div className="cm-toolbar">
          <div className="cm-search">
            <Search />
            <input
              type="search"
              placeholder="Search by request number, subject or requester…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search advisory requests"
            />
            {search && (
              <button className="cm-search-clear" onClick={() => setSearch('')} aria-label="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="cm-toolbar-group">
            {meta && (
              <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>{meta.total.toLocaleString()}</strong> request{meta.total === 1 ? '' : 's'}
              </span>
            )}
            {showFilters && (
              <button
                className={`btn btn-sm ${showFilterDrawer || activeFilterCount ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => setShowFilterDrawer((v) => !v)}
                aria-expanded={showFilterDrawer}
              >
                <Filter size={14} /> Filters
                {activeFilterCount > 0 && <span className="cm-count">{activeFilterCount}</span>}
              </button>
            )}
          </div>
        </div>

        {/* Filter drawer */}
        {showFilters && showFilterDrawer && (
          <div className="cm-filters">
            <div className="cm-filter-field">
              <label htmlFor="adv-status">Status</label>
              <select
                id="adv-status" className="form-control"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All statuses</option>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{prettyEnum(s)}</option>)}
              </select>
            </div>
            <div className="cm-filter-field">
              <label htmlFor="adv-category">Category</label>
              <select
                id="adv-category" className="form-control"
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              >
                <option value="">All categories</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="cm-filter-field">
              <label htmlFor="adv-priority">Priority</label>
              <select
                id="adv-priority" className="form-control"
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
              >
                <option value="">All priorities</option>
                {PRIORITIES.map((p) => <option key={p} value={p}>{prettyEnum(p)}</option>)}
              </select>
            </div>
            {(activeFilterCount > 0 || search) && (
              <div className="cm-filters-footer">
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  <X size={14} /> Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bulk action bar */}
        {showBulkActions && selected.length > 0 && (
          <div className="cm-toolbar" style={{ background: 'var(--accent-glow)' }}>
            <div className="cm-toolbar-group">
              <Users size={15} style={{ color: 'var(--accent-hover)' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {selected.length} request{selected.length === 1 ? '' : 's'} selected
              </span>
            </div>
            <div className="cm-toolbar-group">
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: 200 }}
                disabled={reassigning}
                onChange={(e) => { if (e.target.value) handleBulkReassign(e.target.value); }}
                defaultValue=""
                aria-label="Bulk reassign to officer"
              >
                <option value="" disabled>{reassigning ? 'Reassigning…' : 'Bulk reassign to…'}</option>
                {officers?.map((o) => (
                  <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>
                ))}
              </select>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}>
                <X size={14} /> Clear selection
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        {isLoading ? (
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 46, borderRadius: 8 }} />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-danger" style={{ margin: 18 }}>
            Could not load advisory requests.
            <button className="btn btn-sm btn-ghost" style={{ marginLeft: 10 }} onClick={() => refetch()}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state" style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{
              width: 66, height: 66, margin: '0 auto 16px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', borderRadius: 20,
              background: 'var(--bg-input)', border: '1px solid var(--border)',
            }}>
              <Inbox size={30} style={{ color: 'var(--text-muted)' }} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              {emptyMessage ?? 'No legal advisory requests found'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 380, margin: '0 auto 18px' }}>
              {activeFilterCount > 0 || debouncedSearch
                ? 'No requests match the current search and filters.'
                : 'Nothing to show here yet.'}
            </p>
            {(activeFilterCount > 0 || debouncedSearch) && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        ) : (
          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="cm-pagination">
            <span>
              Page <strong style={{ color: 'var(--text-primary)' }}>{meta.page}</strong> of{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{meta.totalPages}</strong>
              {' · '}{meta.total.toLocaleString()} total
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="cm-page-btn"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                className="cm-page-btn"
                disabled={page >= meta.totalPages}
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
