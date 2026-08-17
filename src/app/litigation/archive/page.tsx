'use client';

import LitigationListView from '@/components/litigation/LitigationListView';
import { RoleGuard } from '@/components/advisory/RoleGuard';

export default function CaseArchivePage() {
  return (
    <RoleGuard roles={['manager', 'admin_assistant']}>
      <LitigationListView
        title="Case Archive"
        subtitle="Closed cases — settled, won, lost, or dismissed."
        lockedStatuses={['SETTLED', 'WON', 'LOST', 'DISMISSED', 'CLOSED']}
        emptyLabel="The case archive is empty"
      />
    </RoleGuard>
  );
}
