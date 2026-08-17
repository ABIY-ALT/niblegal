'use client';

import { DocumentTable } from '@/components/knowledge/DocumentTable';

export default function PolicyLibraryPage() {
  return (
    <DocumentTable
      scope="policies"
      title="Policy Library"
      subtitle="Internal policies and procedures governing legal practice at the bank."
      emptyMessage="No policies or procedures found"
      showFilters
      showNewButton
    />
  );
}
