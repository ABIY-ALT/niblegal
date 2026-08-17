'use client';

import { DocumentTable } from '@/components/knowledge/DocumentTable';

export default function ClauseLibraryPage() {
  return (
    <DocumentTable
      scope="clauses"
      title="Legal Clause Library"
      subtitle="Standard clauses — confidentiality, termination, jurisdiction, indemnity and more."
      emptyMessage="No standard clauses found — confidentiality, termination, jurisdiction, force majeure, indemnity, payment, and dispute resolution clauses live here"
      showFilters
      showNewButton
    />
  );
}
