'use client';

import ContractsListView from '@/components/contracts/ContractsListView';
import { RoleGuard } from '@/components/advisory/RoleGuard';
import { ANY_CONTRACT } from '@/lib/access';

export default function DraftContractsPage() {
  return (
    <RoleGuard roles={['manager', 'legal_officer']} anyOf={ANY_CONTRACT}>
      <ContractsListView
        title="Draft Contracts"
        subtitle="Contract requests still in drafting, not yet submitted for review."
        lockedStatuses={['DRAFT']}
        emptyLabel="No draft contracts"
      />
    </RoleGuard>
  );
}
