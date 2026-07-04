'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function PendingReviewPage() {
  return (
    <RequestTable
      scope="review"
      title="Pending Review"
      emptyMessage="No legal opinions are currently awaiting peer review"
    />
  );
}
