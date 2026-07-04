import { diffOpinionContent } from '@/lib/diff';
import type { LegalOpinionVersionRecord } from '@/types/advisory';

export function VersionCompare({
  oldVersion,
  newVersion,
}: {
  oldVersion: LegalOpinionVersionRecord;
  newVersion: LegalOpinionVersionRecord;
}) {
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
