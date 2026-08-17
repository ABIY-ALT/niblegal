'use client';

import { DocumentTable } from '@/components/knowledge/DocumentTable';

export default function RepositoryListPage() {
  return (
    <DocumentTable
      scope="all"
      title="Repository List"
      subtitle="Every document in the knowledge base, filterable by status and access level."
      emptyMessage="No knowledge documents found"
      showFilters
      showNewButton
    />
  );
}
