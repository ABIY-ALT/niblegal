'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function ApprovedOpinionsPage() {
  return (
    <RequestTable
      scope="approved"
      title="Approved Opinions"
      emptyMessage="No legal opinions have been approved yet"
    />
  );
}
