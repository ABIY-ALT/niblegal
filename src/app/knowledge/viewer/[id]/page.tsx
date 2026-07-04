'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Link as LinkIcon, Check } from 'lucide-react';
import { StatusBadge } from '@/components/knowledge/StatusBadge';
import { DocumentViewer } from '@/components/knowledge/DocumentViewer';
import type { KnowledgeDocumentDetail } from '@/types/knowledge';

export default function DocumentViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['knowledge-document', id],
    queryFn: async () => {
      const res = await fetch(`/api/knowledge/documents/${id}`);
      const json = await res.json();
      return json.data as KnowledgeDocumentDetail;
    },
  });

  const handleDownload = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/knowledge/documents/${id}/download`, { method: 'POST' });
      if (!res.ok) return;
      const { data: file } = await res.json();
      const a = document.createElement('a');
      a.href = file.fileUrl;
      a.download = file.fileName;
      a.click();
    } finally {
      setBusy(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading || !data) {
    return <div className="text-center py-20"><div className="spinner-sm border-accent" /></div>;
  }

  const latestVersion = data.versions[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <Link href={`/knowledge/${id}`} className="btn btn-ghost btn-sm pl-0 mb-3">
            <ArrowLeft size={16} /> Back to Details
          </Link>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-accent font-semibold">{data.documentNumber}</span>
            <StatusBadge status={data.status} />
          </div>
          <h1 className="text-2xl font-bold">{data.title}</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={handleShare}>
            {copied ? <Check size={16} /> : <LinkIcon size={16} />} {copied ? 'Copied' : 'Share Link'}
          </button>
          {latestVersion?.fileUrl && (
            <button className="btn btn-primary" disabled={busy} onClick={handleDownload}>
              <Download size={16} /> Download
            </button>
          )}
        </div>
      </div>

      <div className="card">
        {latestVersion?.fileUrl ? (
          <DocumentViewer fileUrl={latestVersion.fileUrl} fileName={latestVersion.fileName ?? data.title} fileType={latestVersion.fileType ?? ''} />
        ) : data.content ? (
          <div className="tiptap-content" dangerouslySetInnerHTML={{ __html: data.content }} />
        ) : (
          <div className="empty-state"><p>No file or content available to preview yet.</p></div>
        )}
      </div>
    </div>
  );
}
