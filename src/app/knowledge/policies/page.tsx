'use client';

import { DocumentTable } from '@/components/knowledge/DocumentTable';

export default function PolicyLibraryPage() {
  return (
    <DocumentTable
      scope="policies"
      title="Policy Library"
      emptyMessage="No policies or procedures found"
      showFilters
      showNewButton
    />
  );
}
