'use client';

import { DocumentTable } from '@/components/knowledge/DocumentTable';

export default function ResearchArticlesPage() {
  return (
    <DocumentTable
      scope="research"
      title="Research & Articles"
      subtitle="Legal research papers and articles produced or collected by the department."
      emptyMessage="No legal research or articles found"
      showFilters
      showNewButton
    />
  );
}
