'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function AdvisoryListPage() {
  return (
    <RequestTable
      scope="all"
      title="Legal Advisory Requests"
      subtitle="Search, filter and export every advisory request across the bank."
      emptyMessage="No legal advisory requests found"
      showFilters
      showBulkActions
      showNewButton
    />
  );
}
