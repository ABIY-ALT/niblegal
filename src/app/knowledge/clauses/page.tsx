'use client';

import { DocumentTable } from '@/components/knowledge/DocumentTable';

export default function ClauseLibraryPage() {
  return (
    <DocumentTable
      scope="clauses"
      title="Legal Clause Library"
      emptyMessage="No standard clauses found — confidentiality, termination, jurisdiction, force majeure, indemnity, payment, and dispute resolution clauses live here"
      showFilters
      showNewButton
    />
  );
}
