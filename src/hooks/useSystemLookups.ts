'use client';

import { useQuery } from '@tanstack/react-query';

export interface SystemLookups {
  RequestType: string[];
  ContractCategory: string[];
  LitigationCategory: string[];
}

const DEFAULT_LOOKUPS: SystemLookups = {
  RequestType: ["LEGAL_OPINION", "CONTRACT_REVIEW_REQUEST", "COMPLIANCE_ADVICE", "DISPUTE_ADVICE", "GENERAL_INQUIRY", "OTHER"],
  ContractCategory: ["SERVICE_AGREEMENT", "PROCUREMENT", "EMPLOYMENT", "LEASE", "LOAN_AGREEMENT", "NDA", "PARTNERSHIP", "CONSULTANCY", "OTHER"],
  LitigationCategory: ["LABOR_DISPUTE", "DEBT_RECOVERY", "BREACH_OF_CONTRACT", "PROPERTY_CLAIM", "REGULATORY", "CUSTOMER_DISPUTE", "OTHER"],
};

export function useSystemLookups() {
  const { data, isLoading } = useQuery<{ lookupConfig: SystemLookups }>({
    queryKey: ['system-settings-lookups'],
    queryFn: async () => {
      const res = await fetch('/api/system?section=settings');
      if (!res.ok) throw new Error('Failed to fetch lookups');
      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const lookups: SystemLookups = {
    ...DEFAULT_LOOKUPS,
    ...(data?.lookupConfig || {}),
  };

  return { lookups, isLoading };
}
