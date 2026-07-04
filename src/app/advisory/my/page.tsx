'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function MyAdvisoryRequestsPage() {
  return (
    <RequestTable
      scope="my"
      title="My Requests"
      emptyMessage="You haven't submitted any legal advisory requests yet"
      showNewButton
    />
  );
}
