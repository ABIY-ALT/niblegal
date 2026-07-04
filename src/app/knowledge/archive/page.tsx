'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Download, RotateCcw, Trash2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { KnowledgeDocumentListItem } from '@/types/knowledge';

export default function ArchivePage() {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-archive'],
    queryFn: async () => {
      const res = await fetch('/api/knowledge/documents?status=ARCHIVED&limit=50');
      const json = await res.json();
      return json.data as KnowledgeDocumentListItem[];
    },
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ['knowledge-archive'] });

  const canManage = currentUser?.role === 'admin_assistant' || currentUser?.role === 'manager';
  const canDelete = currentUser?.role === 'admin_assistant';

  const handleRestore = async (id: string) => {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/knowledge/documents/${id}/restore`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Restore failed');
      }
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/knowledge/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Delete failed');
      }
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleDownload = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/knowledge/documents/${id}/download`, { method: 'POST' });
      if (!res.ok) return;
      const { data: file } = await res.json();
      const a = document.createElement('a');
      a.href = file.fileUrl;
      a.download = file.fileName;
      a.click();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold mb-1">Archive</h1>
        <p className="text-muted text-sm">Archived knowledge documents. {canManage ? 'Restore or download below.' : ''}</p>
      </div>

      {error && <div className="login-alert login-alert-error">{error}</div>}

      <div className="card">
        {isLoading ? (
          <div className="text-center py-10"><div className="spinner-sm border-accent" /></div>
        ) : !data || data.length === 0 ? (
          <div className="empty-state"><p>No archived documents.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Document ID</th><th>Title</th><th>Category</th><th>Owner</th><th>Archived</th><th></th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.id}>
                    <td><Link href={`/knowledge/${d.id}`} className="text-accent font-mono text-sm hover:underline">{d.documentNumber}</Link></td>
                    <td>{d.title}</td>
                    <td>{d.category.name}</td>
                    <td>{d.author.firstName} {d.author.lastName}</td>
                    <td>{format(new Date(d.updatedAt), 'MMM d, yyyy')}</td>
                    <td>
                      <div className="flex gap-1 justify-end">
                        <button className="btn btn-ghost btn-sm p-1" disabled={busyId === d.id} onClick={() => handleDownload(d.id)} title="Download">
                          <Download size={14} />
                        </button>
                        {canManage && (
                          <button className="btn btn-ghost btn-sm p-1" disabled={busyId === d.id} onClick={() => handleRestore(d.id)} title="Restore">
                            <RotateCcw size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button className="btn btn-ghost btn-sm p-1 text-danger" disabled={busyId === d.id} onClick={() => handleDelete(d.id, d.title)} title="Delete (Admin Only)">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
