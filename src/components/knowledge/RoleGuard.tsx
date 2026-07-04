'use client';

import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { UserRole } from '@/types';

export function RoleGuard({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="spinner-sm border-accent" />
      </div>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="empty-state">
        <ShieldAlert />
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
