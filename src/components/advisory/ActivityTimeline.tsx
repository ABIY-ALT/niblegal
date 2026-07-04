import { Activity } from 'lucide-react';
import { format } from 'date-fns';
import type { LegalHistoryRecord } from '@/types/advisory';

export function ActivityTimeline({ history }: { history: LegalHistoryRecord[] }) {
  if (history.length === 0) {
    return (
      <div className="empty-state">
        <Activity />
        <p>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="timeline premium-timeline">
      {history.map((entry) => (
        <div className="timeline-item" key={entry.id}>
          <div className="timeline-dot">
            <Activity />
          </div>
          <div className="timeline-content">
            <div className="timeline-action">{entry.description}</div>
            <div className="timeline-meta">
              {entry.actor ? `${entry.actor.firstName} ${entry.actor.lastName} · ` : 'System · '}
              {format(new Date(entry.createdAt), 'MMM d, yyyy HH:mm')}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
