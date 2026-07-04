import { format } from 'date-fns';
import type { KnowledgeDocumentDetail } from '@/types/knowledge';
import { ConfidentialityBadge } from './ConfidentialityBadge';

export function MetadataPanel({ doc }: { doc: KnowledgeDocumentDetail }) {
  return (
    <div className="form-row cols-2">
      <div><div className="form-label mb-1">Document ID</div><div className="font-mono text-sm">{doc.documentNumber}</div></div>
      <div><div className="form-label mb-1">Category</div><div>{doc.category.name}</div></div>
      <div><div className="form-label mb-1">Confidentiality</div><ConfidentialityBadge level={doc.confidentiality} /></div>
      <div><div className="form-label mb-1">Owner</div><div>{doc.author.firstName} {doc.author.lastName}</div></div>
      <div><div className="form-label mb-1">Version</div><div>v{doc.currentVersion}</div></div>
      <div><div className="form-label mb-1">Downloads</div><div>{doc.downloads}</div></div>
      <div><div className="form-label mb-1">Effective Date</div><div>{doc.effectiveDate ? format(new Date(doc.effectiveDate), 'MMM d, yyyy') : '—'}</div></div>
      <div><div className="form-label mb-1">Review Date</div><div>{doc.reviewDate ? format(new Date(doc.reviewDate), 'MMM d, yyyy') : '—'}</div></div>
      <div><div className="form-label mb-1">Expiry Date</div><div>{doc.expiryDate ? format(new Date(doc.expiryDate), 'MMM d, yyyy') : '—'}</div></div>
      {doc.lawName && <div><div className="form-label mb-1">Law</div><div>{doc.lawName}</div></div>}
      {doc.articleNumber && <div><div className="form-label mb-1">Article</div><div>{doc.articleNumber}</div></div>}
      {doc.sectionNumber && <div><div className="form-label mb-1">Section</div><div>{doc.sectionNumber}</div></div>}
      {doc.keywords.length > 0 && (
        <div className="col-span-2">
          <div className="form-label mb-1">Keywords</div>
          <div className="tags-list">{doc.keywords.map((k) => <span key={k} className="tag">{k}</span>)}</div>
        </div>
      )}
      <div>
        <div className="form-label mb-1">Tags</div>
        <div className="tags-list">{doc.tags.map((t) => <span key={t.id} className="tag">{t.name}</span>)}</div>
      </div>
    </div>
  );
}
