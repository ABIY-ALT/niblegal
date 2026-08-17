'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function ClosedAdvisoryRequestsPage() {
  return (
    <RequestTable
      scope="closed"
      title="Closed Requests"
      subtitle="Completed and archived advisory matters, retained for the record."
      emptyMessage="No closed or archived requests found"
      showFilters
    />
  );
}
