'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * Approval is now handled inline on the unified contract detail page
 * (Workflow actions → Approve / Reject). This route redirects there.
 */
export default function ContractApproveRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) ?? '';

  useEffect(() => {
    router.replace(id ? `/contracts/${id}` : '/contracts/list');
  }, [id, router]);

  return <div className="text-center py-20 text-muted">Redirecting…</div>;
}
