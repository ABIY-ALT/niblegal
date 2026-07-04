'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { Search, Plus, ChevronLeft, ChevronRight, FileText, FileSpreadsheet } from 'lucide-react';
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
  emptyMessage?: string;
  showFilters?: boolean;
  showBulkActions?: boolean;
  showNewButton?: boolean;
}

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

export function RequestTable({ scope, title, emptyMessage, showFilters, showBulkActions, showNewButton }: Props) {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [reassigning, setReassigning] = useState(false);
  const limit = 15;

  const needsUser = scope === 'my' || scope === 'assigned' || scope === 'drafts';
  const scopeParams = useMemo(() => buildScopeParams(scope, currentUser?.id), [scope, currentUser?.id]);

  const { data: categories } = useQuery({
    queryKey: ['advisory-categories'],
    queryFn: async () => {
      const res = await fetch('/api/advisory/categories');
      if (!res.ok) throw new Error('Failed to load categories');
      const json = await res.json();
      return json.data as LegalRequestCategoryOption[];
    },
    enabled: !!showFilters,
  });

  const { data: officers } = useQuery({
    queryKey: ['advisory-officers'],
    queryFn: async () => {
      const res = await fetch('/api/advisory/officers');
      if (!res.ok) throw new Error('Failed to load officers');
      const json = await res.json();
      return json.data as UserRef[];
    },
    enabled: !!showBulkActions,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['advisory-requests', scope, page, search, statusFilter, categoryFilter, priorityFilter, currentUser?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), ...scopeParams });
      if (search) params.set('search', search);
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

  const toggleSelected = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    const params = new URLSearchParams({ format, ...scopeParams });
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (selected.length > 0) params.set('ids', selected.join(','));
    const res = await fetch(`/api/advisory/requests/export?${params}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-requests.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    a.click();
    URL.revokeObjectURL(url);
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
              header: () => null,
              cell: (info: { row: { original: LegalRequestListItem } }) => (
                <input
                  type="checkbox"
                  checked={selected.includes(info.row.original.id)}
                  onChange={() => toggleSelected(info.row.original.id)}
                />
              ),
            } as ColumnDef<LegalRequestListItem>,
          ]
        : []),
      {
        accessorKey: 'requestNumber',
        header: 'Request ID',
        cell: (info) => (
          <Link href={`/advisory/${info.row.original.id}`} className="text-accent font-semibold hover:underline font-mono text-sm">
            {info.getValue() as string}
          </Link>
        ),
      },
      { accessorKey: 'subject', header: 'Subject' },
      { accessorFn: (r) => r.category.name, id: 'category', header: 'Category' },
      { accessorFn: (r) => r.requestingDepartment.name, id: 'department', header: 'Requesting Dept.' },
      {
        accessorFn: (r) => r.requester,
        id: 'requester',
        header: 'Requested By',
        cell: (info) => {
          const u = info.getValue() as UserRef;
          return `${u.firstName} ${u.lastName}`;
        },
      },
      {
        accessorFn: (r) => r.assignee,
        id: 'assignee',
        header: 'Assigned Officer',
        cell: (info) => {
          const u = info.getValue() as UserRef | null;
          return u ? `${u.firstName} ${u.lastName}` : <span className="text-muted">Unassigned</span>;
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
        header: 'Date Submitted',
        cell: (info) => format(new Date(info.getValue() as string), 'MMM d, yyyy'),
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: (info) => {
          const v = info.getValue() as string | null;
          return v ? format(new Date(v), 'MMM d, yyyy') : '—';
        },
      },
    ],
    [showBulkActions, selected],
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
            <Link href="/advisory/new" className="btn btn-primary">
              <Plus size={16} /> New Request
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
              placeholder="Search requests..."
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
                {['DRAFT','SUBMITTED','VALIDATED','ASSIGNED','DRAFTING','REVIEW','RETURNED','PENDING_APPROVAL','APPROVED','DISPATCHED','CLOSED','ARCHIVED','REJECTED','ESCALATED'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              <select className="form-control" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
                <option value="">All Categories</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select className="form-control" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
                <option value="">All Priorities</option>
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </>
          )}
        </div>

        {showBulkActions && selected.length > 0 && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-md" style={{ background: 'var(--bg-input)' }}>
            <span className="text-sm">{selected.length} selected</span>
            <select
              className="form-control btn-sm"
              disabled={reassigning}
              onChange={(e) => {
                if (e.target.value) handleBulkReassign(e.target.value);
              }}
              defaultValue=""
            >
              <option value="" disabled>
                Bulk reassign to...
              </option>
              {officers?.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.firstName} {o.lastName}
                </option>
              ))}
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10">
            <div className="spinner-sm border-accent" />
          </div>
        ) : error ? (
          <div className="text-danger py-10 text-center">Error loading requests</div>
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
                        <p>{emptyMessage ?? 'No legal advisory requests found'}</p>
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
