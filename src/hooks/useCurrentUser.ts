'use client';

import { useQuery } from '@tanstack/react-query';
import type { SessionUser } from '@/lib/session';

export function useCurrentUser() {
  return useQuery<SessionUser | null>({
    queryKey: ['current-user'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        return null;
      }

      if (!res.ok) {
        throw new Error(`Failed to load current user (${res.status})`);
      }

      const json = await res.json();
      return json.data as SessionUser;
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });
}
