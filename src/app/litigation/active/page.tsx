'use client';

import LitigationListView from '@/components/litigation/LitigationListView';
import { RoleGuard } from '@/components/advisory/RoleGuard';

export default function ActiveCasesPage() {
  return (
    <RoleGuard roles={['manager', 'legal_officer', 'admin_assistant', 'requesting_organ']}>
      <LitigationListView
        title="Active Cases"
        subtitle="Court cases currently open, pending, or on hold."
        lockedStatuses={['ACTIVE', 'PENDING', 'ON_HOLD']}
        emptyLabel="No active cases"
      />
    </RoleGuard>
  );
}
