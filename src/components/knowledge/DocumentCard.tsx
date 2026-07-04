import Link from 'next/link';
import { Folder, FileText } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { KnowledgeCategoryOption, KnowledgeDocumentListItem } from '@/types/knowledge';

export function CategoryCard({ category, onClick }: { category: KnowledgeCategoryOption; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="card hover-card text-left flex flex-col items-start gap-2">
      <div className="w-11 h-11 rounded-md flex items-center justify-center" style={{ background: 'var(--bg-input)' }}>
        <Folder size={20} className="text-accent" />
      </div>
      <div className="font-semibold text-sm">{category.name}</div>
      <div className="text-xs text-muted">{category.documentCount ?? 0} items</div>
    </button>
  );
}

export function DocumentCard({ doc }: { doc: KnowledgeDocumentListItem }) {
  return (
    <Link href={`/knowledge/${doc.id}`} className="card hover-card flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <FileText size={22} className="text-accent" />
        <StatusBadge status={doc.status} />
      </div>
      <div className="font-semibold text-sm line-clamp-2">{doc.title}</div>
      <div className="text-xs text-muted font-mono">{doc.documentNumber}</div>
      <div className="text-xs text-muted mt-auto">{doc.category.name}</div>
    </Link>
  );
}
