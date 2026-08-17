'use client';

import type { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { hasAccess } from '@/lib/access';
import type { UserRole } from '@/types';

/**
 * Page-level authorisation.
 *
 * `roles` alone locked out every custom role, because a role created in admin
 * gets a slug that matches none of the four built-ins. Pass `permission`/`anyOf`
 * and the check keys off the RBAC catalog instead, so a "Director" holding
 * `contract.approve` gets in. A user passes if EITHER the role matches OR the
 * permission is held.
 */
export function RoleGuard({
  roles,
  permission,
  anyOf,
  children,
}: {
  roles?: UserRole[];
  permission?: string;
  anyOf?: string[];
  children: ReactNode;
}) {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="spinner-sm border-accent" />
      </div>
    );
  }

  if (!hasAccess(user, { roles, permission, anyOf })) {
    return (
      <div className="empty-state">
        <ShieldAlert />
        <p>You do not have permission to view this page.</p>
        {user && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Signed in as <strong>{user.name}</strong> ({user.roleName ?? user.role}).
            Ask an administrator to grant{' '}
            <strong>{permission ?? anyOf?.join(' or ') ?? 'the required'}</strong> permission.
          </p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
