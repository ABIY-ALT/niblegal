'use client';

import { DocumentTable } from '@/components/knowledge/DocumentTable';

export default function TemplateLibraryPage() {
  return (
    <DocumentTable
      scope="templates"
      title="Template Library"
      subtitle="Approved contract and legal opinion templates, ready to adapt."
      emptyMessage="No templates found — contract templates, legal opinion templates, and standard clauses live here"
      showFilters
      showNewButton
    />
  );
}
