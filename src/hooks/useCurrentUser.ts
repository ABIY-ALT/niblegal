'use client';

import { useQuery } from '@tanstack/react-query';
import type { SessionUser } from '@/lib/session';

export function useCurrentUser() {
  return useQuery<SessionUser>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) throw new Error('Not authenticated');
      const json = await res.json();
      return json.data as SessionUser;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
