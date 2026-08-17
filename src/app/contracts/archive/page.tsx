'use client';

import ContractsListView from '@/components/contracts/ContractsListView';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { ANY_CONTRACT } from '@/lib/access';

export default function ArchiveContractsPage() {
  return (
    <RoleGuard roles={['manager', 'admin_assistant']} anyOf={ANY_CONTRACT}>
      <ContractsListView
        title="Archive"
        subtitle="Closed contracts — expired, terminated, or renewed under a new agreement."
        lockedStatuses={['EXPIRED', 'TERMINATED', 'RENEWED']}
        emptyLabel="The archive is empty"
      />
    </RoleGuard>
  );
}
