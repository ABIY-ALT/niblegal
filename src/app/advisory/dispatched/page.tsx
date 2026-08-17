'use client';

import { RequestTable } from '@/components/advisory/RequestTable';

export default function DispatchedOpinionsPage() {
  return (
    <RequestTable
      scope="dispatched"
      title="Dispatched Opinions"
      subtitle="Opinions delivered to the requesting department."
      emptyMessage="No legal opinions have been dispatched yet"
    />
  );
}
