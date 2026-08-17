'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function DraftAdvisoryOpinionsPage() {
  return (
    <RequestTable
      scope="drafts"
      title="Draft Opinions"
      subtitle="Legal opinions you are currently drafting, before peer review."
      emptyMessage="You have no legal opinions in drafting"
    />
  );
}
