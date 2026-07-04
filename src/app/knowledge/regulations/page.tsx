'use client';

import { DocumentTable } from '@/components/knowledge/DocumentTable';

export default function RegulationLibraryPage() {
  return (
    <DocumentTable
      scope="regulations"
      title="Regulation Library"
      emptyMessage="No NBE directives or regulations found — search by law name, article, section, or keyword"
      showFilters
      showNewButton
    />
  );
}
