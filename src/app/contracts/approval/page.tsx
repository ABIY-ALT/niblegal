'use client';

import ContractsListView from '@/components/contracts/ContractsListView';
import { RoleGuard } from '@/components/advisory/RoleGuard';

export default function ApprovalContractsPage() {
  return (
    <RoleGuard roles={['manager']} permission="contract.approve">
      <ContractsListView
        title="Pending Approval"
        subtitle="Contracts awaiting your final approval."
        lockedStatuses={['PENDING_APPROVAL']}
        emptyLabel="Nothing pending approval"
      />
    </RoleGuard>
  );
}
