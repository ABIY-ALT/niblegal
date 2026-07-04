'use client';

import { DocumentTable } from '@/components/knowledge/DocumentTable';

export default function RepositoryListPage() {
  return (
    <DocumentTable
      scope="all"
      title="Repository List"
      emptyMessage="No knowledge documents found"
      showFilters
      showNewButton
    />
  );
}
