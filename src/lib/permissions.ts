import prisma from '@/lib/prisma';

/**
 * Canonical permission catalog for the platform (BR-CMS-04, §3.5). Kept in code
 * so the set is versioned and self-documenting; ensurePermissions() upserts it
 * into the DB so the RBAC admin always has the full catalog to assign from.
 */
export interface PermissionDef {
  name: string;
  description: string;
  group: string;
}

export const PERMISSION_CATALOG: PermissionDef[] = [
  // Contracts (CMS)
  { name: 'contract.view', description: 'View contracts', group: 'Contracts' },
  { name: 'contract.create', description: 'Create contract requests', group: 'Contracts' },
  { name: 'contract.assign', description: 'Assign drafting/review officers', group: 'Contracts' },
  { name: 'contract.review', description: 'Perform legal review of contracts', group: 'Contracts' },
  { name: 'contract.approve', description: 'Approve/reject contracts (maker–checker)', group: 'Contracts' },
  { name: 'contract.execute', description: 'Mark contracts executed & dispatch', group: 'Contracts' },
  // Advisory (LAHD)
  { name: 'advisory.view', description: 'View advisory requests', group: 'Advisory' },
  { name: 'advisory.create', description: 'Submit advisory requests', group: 'Advisory' },
  { name: 'advisory.assign', description: 'Assign/validate advisory requests', group: 'Advisory' },
  { name: 'advisory.draft', description: 'Draft legal opinions', group: 'Advisory' },
  { name: 'advisory.approve', description: 'Approve/reject legal opinions', group: 'Advisory' },
  { name: 'advisory.dispatch', description: 'Dispatch legal opinions', group: 'Advisory' },
  // Knowledge
  { name: 'knowledge.view', description: 'View the knowledge repository', group: 'Knowledge' },
  { name: 'knowledge.create', description: 'Author knowledge documents', group: 'Knowledge' },
  { name: 'knowledge.approve', description: 'Approve/publish knowledge documents', group: 'Knowledge' },
  // Litigation
  { name: 'litigation.view', description: 'View litigation cases and the court schedule', group: 'Litigation' },
  { name: 'litigation.manage', description: 'Open, update and archive litigation cases', group: 'Litigation' },
  // Reports
  { name: 'reports.view', description: 'View dashboards & reports', group: 'Reports' },
  { name: 'reports.export', description: 'Export reports', group: 'Reports' },
  // Administration
  { name: 'admin.users', description: 'Manage users', group: 'Administration' },
  { name: 'admin.roles', description: 'Manage roles & permissions', group: 'Administration' },
  { name: 'admin.settings', description: 'Manage system settings', group: 'Administration' },
];

let ensured = false;

/** Idempotently make sure every catalog permission exists in the DB. */
export async function ensurePermissions() {
  if (ensured) return;
  await prisma.$transaction(
    PERMISSION_CATALOG.map((p) =>
      prisma.permission.upsert({
        where: { name: p.name },
        update: { description: p.description },
        create: { name: p.name, description: p.description },
      }),
    ),
  );
  ensured = true;
}

/** Group a permission list by catalog group for the RBAC UI. */
export function groupOf(name: string): string {
  return PERMISSION_CATALOG.find((p) => p.name === name)?.group ?? 'Other';
}

const ALL = PERMISSION_CATALOG.map((p) => p.name);

/** Sensible starting grants for the four seeded roles (BR-CMS-04, §3.5). */
export const DEFAULT_ROLE_GRANTS: Record<string, string[]> = {
  Manager: ALL,
  'Legal Officer': [
    'contract.view', 'contract.review', 'contract.execute',
    'advisory.view', 'advisory.draft', 'advisory.dispatch',
    'knowledge.view', 'knowledge.create', 'knowledge.approve',
    'reports.view', 'reports.export',
  ],
  Admin: [
    'admin.users', 'admin.roles', 'admin.settings',
    'contract.view', 'contract.create', 'contract.assign',
    'advisory.view', 'advisory.create', 'advisory.assign',
    'knowledge.view', 'reports.view', 'reports.export',
  ],
  'Requesting Organ': ['contract.view', 'contract.create', 'advisory.view', 'advisory.create', 'knowledge.view'],
};

let grantsEnsured = false;

/**
 * First-run provisioning: give each seeded role its default permission set, but
 * only if it currently has none — so manual RBAC edits are never overwritten.
 */
export async function ensureDefaultRoleGrants() {
  if (grantsEnsured) return;
  await ensurePermissions();
  const perms = await prisma.permission.findMany({ select: { id: true, name: true } });
  const idByName = new Map(perms.map((p) => [p.name, p.id]));

  for (const [roleName, permNames] of Object.entries(DEFAULT_ROLE_GRANTS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName }, include: { _count: { select: { permissions: true } } } });
    if (!role || role._count.permissions > 0) continue;
    await prisma.role.update({
      where: { id: role.id },
      data: { permissions: { connect: permNames.map((n) => idByName.get(n)).filter(Boolean).map((id) => ({ id: id as string })) } },
    });
  }
  grantsEnsured = true;
}
