'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function MyAdvisoryRequestsPage() {
  return (
    <RequestTable
      scope="my"
      title="My Requests"
      subtitle="Advisory requests you have submitted, and where each one stands."
      emptyMessage="You haven't submitted any legal advisory requests yet"
      showNewButton
    />
  );
}
