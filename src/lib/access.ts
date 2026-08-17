import type { SessionUser } from '@/lib/session';

/**
 * Permission-based authorisation.
 *
 * The app used to authorise purely on a coarse role slug (`manager`,
 * `legal_officer`, `admin_assistant`, `requesting_organ`). A role created in
 * admin — "Director", say — maps to a slug that appears in none of those guard
 * lists, so the holder matched nothing: empty sidebar, blocked pages, 403s on
 * every action. Meanwhile the Role → Permission catalog that admin actually
 * edits was never read by anything.
 *
 * These helpers read the permissions carried on the session, so built-in and
 * custom roles are authorised the same way and the admin RBAC screen becomes
 * the real source of truth.
 */

/* "Any of" sets for module-level access. Someone holding only contract.approve
   still needs to reach the contract screens, so module entry points test the
   whole family rather than a single permission. */
export const ANY_CONTRACT = ['contract.view', 'contract.create', 'contract.assign', 'contract.review', 'contract.approve', 'contract.execute'];
export const ANY_ADVISORY = ['advisory.view', 'advisory.create', 'advisory.assign', 'advisory.draft', 'advisory.approve', 'advisory.dispatch'];
export const ANY_KNOWLEDGE = ['knowledge.view', 'knowledge.create', 'knowledge.approve'];
export const ANY_LITIGATION = ['litigation.view', 'litigation.manage'];
export const ANY_REPORTS = ['reports.view', 'reports.export'];
export const ANY_ADMIN = ['admin.users', 'admin.roles', 'admin.settings'];

/** Minimal shape both server (SessionUser) and client (useCurrentUser) satisfy. */
export interface PermissionCarrier {
  role?: string;
  permissions?: string[] | null;
}

export function can(user: PermissionCarrier | null | undefined, permission: string): boolean {
  if (!user?.permissions) return false;
  return user.permissions.includes(permission);
}

/** True if the user holds at least one of the listed permissions. */
export function canAny(user: PermissionCarrier | null | undefined, permissions: string[]): boolean {
  if (!user?.permissions || permissions.length === 0) return false;
  return permissions.some((p) => user.permissions!.includes(p));
}

/** True if the user holds every listed permission. */
export function canAll(user: PermissionCarrier | null | undefined, permissions: string[]): boolean {
  if (!user?.permissions || permissions.length === 0) return false;
  return permissions.every((p) => user.permissions!.includes(p));
}

/**
 * Access test for a page or endpoint.
 *
 * `permission`/`anyOf` are the real check. `roles` remains supported for the
 * handful of places with no catalog equivalent (and for built-in roles during
 * migration) — a user passes if EITHER the role matches OR they hold the
 * permission, so tightening one never silently locks out the other.
 */
export function hasAccess(
  user: PermissionCarrier | null | undefined,
  rule: { permission?: string; anyOf?: string[]; roles?: readonly string[] },
): boolean {
  if (!user) return false;

  // A rule that states no criteria (including an empty roles list) is open to
  // any signed-in user — used for personal areas like Dashboard/Notifications.
  const hasCriteria = !!rule.permission || !!rule.anyOf?.length || !!rule.roles?.length;
  if (!hasCriteria) return true;

  if (rule.permission && can(user, rule.permission)) return true;
  if (rule.anyOf?.length && canAny(user, rule.anyOf)) return true;
  if (rule.roles?.length && user.role && rule.roles.includes(user.role)) return true;
  return false;
}

/** Server-side guard: returns an error message when the user may not proceed. */
export function denyReason(
  user: SessionUser | null,
  rule: { permission?: string; anyOf?: string[]; roles?: readonly string[] },
): string | null {
  if (!user) return 'Unauthorized';
  if (hasAccess(user, rule)) return null;
  const needed = rule.permission ?? rule.anyOf?.join(' or ') ?? rule.roles?.join(' or ') ?? 'access';
  return `Your role (${user.roleName ?? user.role}) does not have the required permission: ${needed}`;
}
