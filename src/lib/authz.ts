import prisma from '@/lib/prisma';
import type { SessionUser } from '@/lib/session';

/**
 * Fine-grained permission checks backed by the RBAC catalog (§3.5). Route guards
 * currently key off the coarse role slug; this is the seam to migrate them to
 * permission-based checks (e.g. `if (!(await userCan(user, 'contract.approve')))`).
 */
export async function getPermissionsForUser(userId: string): Promise<Set<string>> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { permissions: { select: { name: true } } } } },
  });
  return new Set(u?.role.permissions.map((p) => p.name) ?? []);
}

export async function userCan(user: SessionUser | null, permission: string): Promise<boolean> {
  if (!user) return false;
  const perms = await getPermissionsForUser(user.id);
  return perms.has(permission);
}
