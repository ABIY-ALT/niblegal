'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { 
  Search, Plus, Download, ChevronLeft, ChevronRight, MoreHorizontal, FileText 
} from 'lucide-react';
import { format } from 'date-fns';

export default function ContractsListPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['contracts', page, limit, searchTerm],
    queryFn: async () => {
      const res = await fetch(`/api/contracts?page=${page}&limit=${limit}&search=${searchTerm}`);
      if (!res.ok) throw new Error('Failed to fetch contracts');
      return res.json();
    }
  });

  const columns = [
    {
      accessorKey: 'contractNumber',
      header: 'Contract Number',
      cell: (info: any) => (
        <Link href={`/contracts/${info.row.original.id}`} className="text-accent font-semibold hover:underline font-mono text-sm">
          {info.getValue()}
        </Link>
      ),
    },
    { accessorKey: 'title', header: 'Title' },
    { accessorKey: 'category', header: 'Category' },
    { accessorKey: 'status', header: 'Status', cell: (info: any) => (
      <span className={`badge status-${info.getValue().toLowerCase().replace('_', '-')}`}>
        {info.getValue()}
      </span>
    )},
    { accessorKey: 'counterparty', header: 'Vendor' },
    { accessorKey: 'expiryDate', header: 'Expiry Date', cell: (info: any) => (
      info.getValue() ? format(new Date(info.getValue()), 'MMM d, yyyy') : '—'
    )},
    {
      id: 'actions',
      cell: () => (
        <button className="btn btn-ghost btn-sm p-2"><MoreHorizontal size={16} /></button>
      )
    }
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-1">Contract List</h1>
          <p className="text-muted text-sm">Manage and track all contracts.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary"><Download size={16} /> Export</button>
          <Link href="/contracts/new" className="btn btn-primary"><Plus size={16} /> New Contract</Link>
        </div>
      </div>

      <div className="card">
        <div className="flex gap-3 mb-5 border-b border-border pb-5">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input 
              type="text" 
              placeholder="Search contracts..." 
              className="form-control pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10"><div className="spinner-sm border-accent"></div></div>
        ) : error ? (
          <div className="text-danger py-10 text-center">Error loading contracts</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-10 text-muted">
                      <FileText size={32} className="mx-auto mb-3 opacity-30" />
                      No contracts found
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
              Page {data.meta.page} of {data.meta.totalPages}
            </div>
            <div className="flex gap-2">
              <button 
                className="btn btn-ghost btn-sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              ><ChevronLeft size={16} /></button>
              <button 
                className="btn btn-ghost btn-sm"
                disabled={page === data.meta.totalPages}
                onClick={() => setPage(p => p + 1)}
              ><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
