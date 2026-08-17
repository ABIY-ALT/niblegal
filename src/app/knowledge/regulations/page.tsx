'use client';

import { DocumentTable } from '@/components/knowledge/DocumentTable';

export default function RegulationLibraryPage() {
  return (
    <DocumentTable
      scope="regulations"
      title="Regulation Library"
      subtitle="NBE directives and national laws, searchable by name, article or section."
      emptyMessage="No NBE directives or regulations found — search by law name, article, section, or keyword"
      showFilters
      showNewButton
    />
  );
}
