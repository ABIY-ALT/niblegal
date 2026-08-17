'use client';

import ContractsListView from '@/components/contracts/ContractsListView';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { ANY_CONTRACT } from '@/lib/access';

export default function ExecutedContractsPage() {
  return (
    <RoleGuard roles={['manager', 'legal_officer', 'admin_assistant', 'requesting_organ']} anyOf={ANY_CONTRACT}>
      <ContractsListView
        title="Executed Contracts"
        subtitle="Fully signed and executed contracts."
        lockedStatuses={['EXECUTED']}
        emptyLabel="No executed contracts"
      />
    </RoleGuard>
  );
}
