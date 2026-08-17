'use client';

import ContractsListView from '@/components/contracts/ContractsListView';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { ANY_CONTRACT } from '@/lib/access';

export default function ExpiringContractsPage() {
  return (
    <RoleGuard roles={['manager', 'legal_officer', 'admin_assistant']} anyOf={ANY_CONTRACT}>
      <ContractsListView
        title="Expiring Contracts"
        subtitle="Contracts approaching their expiry date and needing renewal review."
        lockedStatuses={['EXPIRING_SOON']}
        emptyLabel="No contracts are expiring soon"
      />
    </RoleGuard>
  );
}
