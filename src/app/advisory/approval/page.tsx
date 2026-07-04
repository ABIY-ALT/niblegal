'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function PendingApprovalPage() {
  return (
    <RequestTable
      scope="approval"
      title="Pending Approval"
      emptyMessage="No legal opinions are currently awaiting approval"
    />
  );
}
