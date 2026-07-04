'use client';

import { DocumentTable } from '@/components/knowledge/DocumentTable';

export default function ResearchArticlesPage() {
  return (
    <DocumentTable
      scope="research"
      title="Research & Articles"
      emptyMessage="No legal research or articles found"
      showFilters
      showNewButton
    />
  );
}
