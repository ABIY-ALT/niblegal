'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { AttachmentManager } from '@/components/knowledge/AttachmentManager';
import type { KnowledgeDocumentDetail } from '@/types/knowledge';

export default function NewVersionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [file, setFile] = useState<File[]>([]);
  const [content, setContent] = useState('');
  const [changes, setChanges] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-document', id],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/documents/${id}`);
      const json = await res.json();
      return json.data as KnowledgeDocumentDetail;
    },
  });

  if (isLoading || !data) {
    return <div className="text-center py-20"><div className="spinner-sm border-accent" /></div>;
  }

  const isTextDocument = !!data.content && data.versions.every((v) => v.content && !v.fileUrl);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      if (changes) fd.append('changes', changes);
      if (file[0]) fd.append('file', file[0]);
      if (isTextDocument && content) fd.append('content', content);

      const res = await fetch(`/api/knowledge/documents/${id}/versions`, { method: 'POST', body: fd });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Failed to create new version');
      }
      router.push(`/knowledge/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new version');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <div>
        <Link href={`/knowledge/${id}`} className="btn btn-ghost btn-sm pl-0 mb-3">
          <ArrowLeft size={16} /> Back to Document
        </Link>
        <h1 className="text-2xl font-bold mb-1">New Version</h1>
        <p className="text-muted text-sm">{data.documentNumber} — {data.title} (current: v{data.currentVersion})</p>
      </div>

      {error && <div className="login-alert login-alert-error">{error}</div>}

      <div className="card flex flex-col gap-5">
        {isTextDocument ? (
          <div className="form-group">
            <label className="form-label">Updated Content</label>
            <textarea
              className="form-control"
              rows={12}
              defaultValue={data.content ?? ''}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Updated document content..."
            />
          </div>
        ) : (
          <div className="form-group">
            <label className="form-label">Replacement File</label>
            <AttachmentManager mode="local" files={file} onFilesChange={(f) => setFile(f.slice(-1))} />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Change Notes</label>
          <textarea className="form-control" rows={3} value={changes} onChange={(e) => setChanges(e.target.value)} placeholder="What changed in this version?" />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Link href={`/knowledge/${id}`} className="btn btn-ghost">Cancel</Link>
          <button className="btn btn-primary" disabled={submitting || (!file[0] && !content)} onClick={handleSubmit}>
            <Save size={16} /> Save New Version
          </button>
        </div>
      </div>
    </div>
  );
}
