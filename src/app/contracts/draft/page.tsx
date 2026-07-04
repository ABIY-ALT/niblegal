'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Contract drafting now starts from the New Contract form (saved as DRAFT)
 * and continues on the detail page. This route redirects there.
 */
export default function ContractDraftRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/contracts/new'); }, [router]);
  return <div className="text-center py-20 text-muted">Redirecting…</div>;
}
