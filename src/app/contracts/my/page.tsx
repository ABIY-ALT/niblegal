'use client';

import ContractsListView from '@/components/contracts/ContractsListView';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { ANY_CONTRACT } from '@/lib/access';

export default function MyContractsPage() {
  return (
    <RoleGuard roles={['manager', 'legal_officer', 'admin_assistant', 'requesting_organ']} anyOf={ANY_CONTRACT}>
      <ContractsListView
        title="My Contracts"
        subtitle="Contracts you requested or that belong to your department."
        scope="mine"
        emptyLabel="You have no contracts yet"
      />
    </RoleGuard>
  );
}
