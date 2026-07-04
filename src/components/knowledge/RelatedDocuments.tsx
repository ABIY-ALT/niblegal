import Link from 'next/link';
import { FileText } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { KnowledgeDocumentDetail } from '@/types/knowledge';

export function RelatedDocuments({ documents }: { documents: KnowledgeDocumentDetail['relatedDocuments'] }) {
  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <FileText />
        <p>No related documents linked yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {documents.map((d) => (
        <Link key={d.id} href={`/knowledge/${d.id}`} className="flex justify-between items-center text-sm p-2 rounded-md hover-card border border-transparent">
          <span>{d.documentNumber} — {d.title}</span>
          <StatusBadge status={d.status} />
        </Link>
      ))}
    </div>
  );
}
