'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import {
  Search, Plus, ChevronLeft, ChevronRight, FileText, FileSpreadsheet,
  Filter, X, Home, Inbox, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { StatusBadge } from './StatusBadge';
import { ConfidentialityBadge } from './ConfidentialityBadge';
import type { KnowledgeDocumentListItem, KnowledgeCategoryOption } from '@/types/knowledge';

export type DocumentScope = 'all' | 'templates' | 'clauses' | 'policies' | 'regulations' | 'research' | 'favorites' | 'archive';

const SCOPE_CATEGORY_CODES: Partial<Record<DocumentScope, string[]>> = {
  templates: ['CONTRACT_TEMPLATES', 'LEGAL_OPINION_TEMPLATES'],
  clauses: ['STANDARD_CLAUSES'],
  policies: ['POLICIES', 'PROCEDURES'],
  regulations: ['NBE_DIRECTIVES', 'LAWS_REGULATIONS'],
  research: ['LEGAL_RESEARCH', 'ARTICLES'],
};

const STATUSES = ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'EXPIRED'];
const CONFIDENTIALITY = ['PUBLIC_INTERNAL', 'RESTRICTED', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL'];

/** `PENDING_APPROVAL` → `Pending Approval` (the old code only replaced the FIRST underscore). */
const prettyEnum = (v: string) =>
  v.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());

function buildScopeParams(scope: DocumentScope, userId?: string): Record<string, string> {
  const codes = SCOPE_CATEGORY_CODES[scope];
  if (codes) return { categoryCodes: codes.join(',') };
  if (scope === 'favorites') return userId ? { bookmarkedBy: userId } : {};
  if (scope === 'archive') return { status: 'ARCHIVED' };
  return {};
}

interface Props {
  scope: DocumentScope;
  title: string;
  subtitle?: string;
  emptyMessage?: string;
  showFilters?: boolean;
  showNewButton?: boolean;
  categoryId?: string;
  /** Renders without the page hero, for use inside another page's layout. */
  embedded?: boolean;
}

export function DocumentTable({
  scope, title, subtitle, emptyMessage, showFilters, showNewButton, categoryId, embedded,
}: Props) {
  const { data: currentUser } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confidentialityFilter, setConfidentialityFilter] = useState('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'xlsx' | null>(null);
  const limit = 15;

  /* The search term is part of the query key, so binding it directly to the
     input fired one request per keystroke. Debounce before it reaches the key. */
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const needsUser = scope === 'favorites';
  const scopeParams = useMemo(() => buildScopeParams(scope, currentUser?.id), [scope, currentUser?.id]);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['knowledge-documents', scope, page, debouncedSearch, statusFilter, confidentialityFilter, categoryId, currentUser?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), ...scopeParams });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (confidentialityFilter) params.set('confidentiality', confidentialityFilter);
      if (categoryId) params.set('categoryId', categoryId);
      const res = await fetch(`/api/knowledge/documents?${params}`);
      if (!res.ok) throw new Error('Failed to load documents');
      return res.json();
    },
    enabled: !needsUser || !!currentUser?.id,
  });

  const rows: KnowledgeDocumentListItem[] = data?.data ?? [];
  const meta = data?.meta as { total: number; page: number; totalPages: number } | undefined;
  const activeFilterCount = [statusFilter, confidentialityFilter].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter(''); setConfidentialityFilter(''); setSearch(''); setPage(1);
  };

  const handleExport = async (fmt: 'pdf' | 'xlsx') => {
    setExporting(fmt);
    try {
      const params = new URLSearchParams({ format: fmt, ...scopeParams });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryId) params.set('categoryId', categoryId);
      const res = await fetch(`/api/knowledge/documents/export?${params}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-documents.${fmt === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  };

  const columns = useMemo<ColumnDef<KnowledgeDocumentListItem>[]>(
    () => [
      {
        accessorKey: 'documentNumber',
        header: 'Document ID',
        cell: (info) => (
          <Link href={`/knowledge/${info.row.original.id}`} className="cm-ref">
            {info.getValue() as string}
          </Link>
        ),
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: (info) => (
          <div style={{ maxWidth: 300 }}>
            <div className="cm-cell-strong">{info.getValue() as string}</div>
            <div className="cm-cell-sub">{info.row.original.category.name}</div>
          </div>
        ),
      },
      {
        accessorFn: (r) => r.tags,
        id: 'tags',
        header: 'Tags',
        cell: (info) => {
          const tags = info.getValue() as KnowledgeDocumentListItem['tags'];
          if (!tags?.length) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
          return (
            <div className="tags-list">
              {tags.slice(0, 2).map((t) => <span key={t.id} className="tag">{t.name}</span>)}
              {tags.length > 2 && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>+{tags.length - 2}</span>
              )}
            </div>
          );
        },
      },
      {
        accessorFn: (r) => r.author,
        id: 'owner',
        header: 'Owner',
        cell: (info) => {
          const u = info.getValue() as KnowledgeDocumentListItem['author'];
          return (
            <span className="cm-owner">
              <span className="cm-avatar">{u.firstName.charAt(0)}</span>
              {u.firstName} {u.lastName}
            </span>
          );
        },
      },
      {
        accessorKey: 'confidentiality',
        header: 'Access',
        cell: (info) => (
          <ConfidentialityBadge level={info.getValue() as KnowledgeDocumentListItem['confidentiality']} />
        ),
      },
      {
        accessorKey: 'currentVersion',
        header: 'Version',
        cell: (info) => <span className="cm-ref">v{info.getValue() as number}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue() as KnowledgeDocumentListItem['status']} />,
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated',
        cell: (info) => (
          <span className="cm-muted-cell">{format(new Date(info.getValue() as string), 'MMM d, yyyy')}</span>
        ),
      },
      {
        accessorKey: 'downloads',
        header: 'Downloads',
        cell: (info) => <span className="cm-num">{(info.getValue() as number) ?? 0}</span>,
      },
    ],
    [],
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  const panel = (
    <div className="enterprise-panel">

      {/* Toolbar */}
      <div className="cm-toolbar">
        <div className="cm-search">
          <Search />
          <input
            type="search"
            placeholder="Search by document number, title or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search documents"
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
              <strong style={{ color: 'var(--text-primary)' }}>{meta.total.toLocaleString()}</strong>{' '}
              document{meta.total === 1 ? '' : 's'}
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
          {embedded && (
            <button className="btn btn-ghost btn-sm" onClick={() => refetch()} disabled={isFetching} aria-label="Refresh">
              <RefreshCw size={14} style={isFetching ? { animation: 'spin 0.8s linear infinite' } : undefined} />
            </button>
          )}
        </div>
      </div>

      {/* Filter drawer */}
      {showFilters && showFilterDrawer && (
        <div className="cm-filters">
          <div className="cm-filter-field">
            <label htmlFor="kn-status">Status</label>
            <select
              id="kn-status" className="form-control"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{prettyEnum(s)}</option>)}
            </select>
          </div>
          <div className="cm-filter-field">
            <label htmlFor="kn-confidentiality">Confidentiality</label>
            <select
              id="kn-confidentiality" className="form-control"
              value={confidentialityFilter}
              onChange={(e) => { setConfidentialityFilter(e.target.value); setPage(1); }}
            >
              <option value="">All levels</option>
              {CONFIDENTIALITY.map((c) => <option key={c} value={c}>{prettyEnum(c)}</option>)}
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

      {/* Body */}
      {isLoading ? (
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 46, borderRadius: 8 }} />
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-danger" style={{ margin: 18 }}>
          Could not load documents.
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
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>No documents found</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto 18px' }}>
            {activeFilterCount > 0 || debouncedSearch
              ? 'No documents match the current search and filters.'
              : emptyMessage ?? 'Nothing has been added here yet.'}
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(activeFilterCount > 0 || debouncedSearch) && (
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
            )}
            <Link href="/knowledge/new" className="btn btn-primary btn-sm">
              <Plus size={14} /> Upload Document
            </Link>
          </div>
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
  );

  /* Embedded inside another page (the repository browser) — no hero, no
     duplicate page title. The old code rendered an empty <h1> here. */
  if (embedded) return panel;

  return (
    <div className="enterprise-page">
      <div className="enterprise-hero">
        <div className="enterprise-hero-content">
          <div style={{ minWidth: 0 }}>
            <nav className="enterprise-kicker" aria-label="Breadcrumb">
              <Link href="/dashboard" className="enterprise-id" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Home size={11} /> Home
              </Link>
              <ChevronRight size={12} style={{ color: 'rgba(247,245,242,0.45)' }} />
              <Link href="/knowledge" className="enterprise-id" style={{ textDecoration: 'none' }}>Knowledge</Link>
            </nav>
            <h1 className="enterprise-title">{title}</h1>
            {subtitle && <p className="enterprise-subtitle">{subtitle}</p>}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => refetch()}
              disabled={isFetching}
              title="Refresh"
              aria-label="Refresh documents"
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
              <Link href="/knowledge/new" className="btn btn-primary btn-sm">
                <Plus size={14} /> Upload Document
              </Link>
            )}
          </div>
        </div>
      </div>

      {panel}
    </div>
  );
}

export type { KnowledgeCategoryOption };
