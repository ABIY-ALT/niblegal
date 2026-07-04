import { diffOpinionContent } from '@/lib/diff';
import type { KnowledgeVersionRecord } from '@/types/knowledge';

export function VersionCompare({
  oldVersion,
  newVersion,
}: {
  oldVersion: KnowledgeVersionRecord;
  newVersion: KnowledgeVersionRecord;
}) {
  if (!oldVersion.content || !newVersion.content) {
    return (
      <div className="card">
        <p className="text-sm text-muted">
          Content comparison is only available for text-authored versions (templates/clauses/memos).
          File-based versions can be downloaded individually and compared manually.
        </p>
      </div>
    );
  }

  const segments = diffOpinionContent(oldVersion.content, newVersion.content);

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          Comparing v{oldVersion.versionNumber} → v{newVersion.versionNumber}
        </span>
      </div>
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {segments.map((seg, i) => {
          if (seg.type === 'added') {
            return (
              <span key={i} style={{ background: 'rgba(16,185,129,0.25)', color: '#34d399' }}>
                {seg.value}
              </span>
            );
          }
          if (seg.type === 'removed') {
            return (
              <span key={i} style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', textDecoration: 'line-through' }}>
                {seg.value}
              </span>
            );
          }
          return <span key={i}>{seg.value}</span>;
        })}
      </div>
    </div>
  );
}
