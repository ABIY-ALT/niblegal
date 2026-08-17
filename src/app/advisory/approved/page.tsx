'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function ApprovedOpinionsPage() {
  return (
    <RequestTable
      scope="approved"
      title="Approved Opinions"
      subtitle="Signed-off legal opinions ready for dispatch to the requester."
      emptyMessage="No legal opinions have been approved yet"
    />
  );
}
