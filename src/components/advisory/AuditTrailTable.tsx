import { format } from 'date-fns';
import type { AuditLogRecord } from '@/types/advisory';

export function AuditTrailTable({ logs }: { logs: AuditLogRecord[] }) {
  if (logs.length === 0) {
    return (
      <div className="empty-state">
        <p>No audit trail entries yet.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>User</th>
            <th>Details</th>
            <th>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}</td>
              <td>{log.action}</td>
              <td>{log.user.firstName} {log.user.lastName}</td>
              <td>{log.details}</td>
              <td>{log.ipAddress ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
