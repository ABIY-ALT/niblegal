'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function PendingApprovalPage() {
  return (
    <RequestTable
      scope="approval"
      title="Pending Approval"
      subtitle="Reviewed opinions awaiting sign-off from the Legal Manager."
      emptyMessage="No legal opinions are currently awaiting approval"
    />
  );
}
