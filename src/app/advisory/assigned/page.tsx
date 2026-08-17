'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function AssignedAdvisoryRequestsPage() {
  return (
    <RequestTable
      scope="assigned"
      title="Assigned Requests"
      subtitle="Open advisory matters assigned to you for opinion drafting."
      emptyMessage="No requests are currently assigned to you"
    />
  );
}
