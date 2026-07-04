'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function AdvisoryListPage() {
  return (
    <RequestTable
      scope="all"
      title="Legal Advisory Requests"
      emptyMessage="No legal advisory requests found"
      showFilters
      showBulkActions
      showNewButton
    />
  );
}
