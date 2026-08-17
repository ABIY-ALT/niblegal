'use client';

import ContractsListView from '@/components/contracts/ContractsListView';
import { RoleGuard } from '@/components/advisory/RoleGuard';

export default function ReviewContractsPage() {
  return (
    <RoleGuard roles={['manager', 'legal_officer']} permission="contract.review">
      <ContractsListView
        title="Pending Review"
        subtitle="Contracts awaiting legal review."
        lockedStatuses={['UNDER_REVIEW']}
        emptyLabel="Nothing pending review"
      />
    </RoleGuard>
  );
}
