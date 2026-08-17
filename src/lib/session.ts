import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import type { UserRole } from '@/types';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  /**
   * Built-in role slug. Custom roles (e.g. "Director") map to a derived slug
   * that matches none of the built-in guards — which is why authorisation must
   * key off `permissions`, not this field.
   */
  role: UserRole;
  /** Permission names granted via the user's Role → Permission relation. */
  permissions: string[];
  /** Display name of the role as configured in admin (e.g. "Director"). */
  roleName: string;
  departmentId: string | null;
  departmentName: string | null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('nib_token')?.value;
  if (!token) return null;

  const payload = await verifyJwt(token);
  if (!payload) return null;

  const dbUser = await prisma.user.findUnique({
    where: { email: payload.email },
    include: {
      department: true,
      // Permissions come from the DB on every request rather than the JWT, so a
      // role edit in admin takes effect immediately instead of after re-login.
      role: { include: { permissions: { select: { name: true } } } },
    },
  });
  if (!dbUser || !dbUser.isActive) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: `${dbUser.firstName} ${dbUser.lastName}`,
    role: payload.role as UserRole,
    permissions: dbUser.role.permissions.map((p) => p.name),
    roleName: dbUser.role.name,
    departmentId: dbUser.departmentId,
    departmentName: dbUser.department?.name ?? null,
  };
}

export function hasRole(user: SessionUser | null, roles: UserRole[]): boolean {
  return !!user && roles.includes(user.role);
}
