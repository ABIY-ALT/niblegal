'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { Search, Plus, ChevronLeft, ChevronRight, FileText, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { StatusBadge } from './StatusBadge';
import type { KnowledgeDocumentListItem, KnowledgeCategoryOption } from '@/types/knowledge';

export type DocumentScope = 'all' | 'templates' | 'clauses' | 'policies' | 'regulations' | 'research' | 'favorites' | 'archive';

const SCOPE_CATEGORY_CODES: Partial<Record<DocumentScope, string[]>> = {
  templates: ['CONTRACT_TEMPLATES', 'LEGAL_OPINION_TEMPLATES'],
  clauses: ['STANDARD_CLAUSES'],
  policies: ['POLICIES', 'PROCEDURES'],
  regulations: ['NBE_DIRECTIVES', 'LAWS_REGULATIONS'],
  research: ['LEGAL_RESEARCH', 'ARTICLES'],
};

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
  emptyMessage?: string;
  showFilters?: boolean;
  showNewButton?: boolean;
  categoryId?: string;
}

export function DocumentTable({ scope, title, emptyMessage, showFilters, showNewButton, categoryId }: Props) {
  const { data: currentUser } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confidentialityFilter, setConfidentialityFilter] = useState('');
  const limit = 15;

  const needsUser = scope === 'favorites';
  const scopeParams = useMemo(() => buildScopeParams(scope, currentUser?.id), [scope, currentUser?.id]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['knowledge-documents', scope, page, search, statusFilter, confidentialityFilter, categoryId, currentUser?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), ...scopeParams });
      if (search) params.set('search', search);
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

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    const params = new URLSearchParams({ format, ...scopeParams });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (categoryId) params.set('categoryId', categoryId);
    const res = await fetch(`/api/knowledge/documents/export?${params}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knowledge-documents.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<KnowledgeDocumentListItem>[]>(
    () => [
      {
        accessorKey: 'documentNumber',
        header: 'Document ID',
        cell: (info) => (
          <Link href={`/knowledge/${info.row.original.id}`} className="text-accent font-semibold hover:underline font-mono text-sm">
            {info.getValue() as string}
          </Link>
        ),
      },
      { accessorKey: 'title', header: 'Title' },
      { accessorFn: (r) => r.category.name, id: 'category', header: 'Category' },
      {
        accessorFn: (r) => r.tags,
        id: 'tags',
        header: 'Tags',
        cell: (info) => {
          const tags = info.getValue() as KnowledgeDocumentListItem['tags'];
          return (
            <div className="tags-list">
              {tags.slice(0, 3).map((t) => <span key={t.id} className="tag">{t.name}</span>)}
              {tags.length > 3 && <span className="text-xs text-muted">+{tags.length - 3}</span>}
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
          return `${u.firstName} ${u.lastName}`;
        },
      },
      {
        accessorKey: 'currentVersion',
        header: 'Version',
        cell: (info) => `v${info.getValue()}`,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue() as KnowledgeDocumentListItem['status']} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Created Date',
        cell: (info) => format(new Date(info.getValue() as string), 'MMM d, yyyy'),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Updated Date',
        cell: (info) => format(new Date(info.getValue() as string), 'MMM d, yyyy'),
      },
      { accessorKey: 'downloads', header: 'Downloads' },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold mb-1">{title}</h1>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => handleExport('xlsx')}>
            <FileSpreadsheet size={16} /> Excel
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('pdf')}>
            <FileText size={16} /> PDF
          </button>
          {showNewButton && (
            <Link href="/knowledge/new" className="btn btn-primary">
              <Plus size={16} /> Upload Document
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <div className="filters-bar border-b border-border pb-5 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search documents..."
              className="form-control pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {showFilters && (
            <>
              <select className="form-control" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">All Statuses</option>
                {['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'EXPIRED'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <select className="form-control" value={confidentialityFilter} onChange={(e) => { setConfidentialityFilter(e.target.value); setPage(1); }}>
                <option value="">All Confidentiality Levels</option>
                {['PUBLIC_INTERNAL', 'RESTRICTED', 'CONFIDENTIAL', 'HIGHLY_CONFIDENTIAL'].map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ')}</option>
                ))}
              </select>
            </>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <div className="spinner-sm border-accent" />
          </div>
        ) : error ? (
          <div className="text-danger py-10 text-center">Error loading documents</div>
        ) : (
          <div className="table-wrapper">
            <table>
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
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-10 text-muted">
                      <div className="empty-state">
                        <FileText size={32} className="mx-auto mb-3 opacity-30" />
                        <p>{emptyMessage ?? 'No documents found'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex justify-between items-center mt-5 pt-5 border-t border-border">
            <div className="text-sm text-muted">
              Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} total)
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft size={16} />
              </button>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page === data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export type { KnowledgeCategoryOption };
