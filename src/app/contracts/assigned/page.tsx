'use client';

import ContractsListView from '@/components/contracts/ContractsListView';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { ANY_CONTRACT } from '@/lib/access';

export default function AssignedContractsPage() {
  return (
    <RoleGuard roles={['manager', 'legal_officer']} anyOf={ANY_CONTRACT}>
      <ContractsListView
        title="Assigned Contracts"
        subtitle="Contracts currently assigned to you for drafting or review."
        scope="assigned"
        emptyLabel="No contracts are assigned to you"
      />
    </RoleGuard>
  );
}
