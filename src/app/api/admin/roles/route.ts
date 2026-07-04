import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { ensurePermissions, ensureDefaultRoleGrants } from '@/lib/permissions';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  if (!['manager', 'admin_assistant'].includes(user.role)) return { error: 'Forbidden', status: 403 as const };
  return { user };
}

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  await ensureDefaultRoleGrants();
  const roles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
    include: {
      permissions: { select: { id: true, name: true } },
      _count: { select: { users: true } },
    },
  });

  return NextResponse.json({
    data: roles.map((r) => ({
      id: r.id,
      name: r.name,
      userCount: r._count.users,
      permissions: r.permissions.map((p) => p.name),
      permissionIds: r.permissions.map((p) => p.id),
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { name, permissionIds } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: 'Role name is required' }, { status: 400 });

    const exists = await prisma.role.findUnique({ where: { name: name.trim() } });
    if (exists) return NextResponse.json({ error: 'A role with that name already exists' }, { status: 409 });

    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        permissions: Array.isArray(permissionIds) ? { connect: permissionIds.map((id: string) => ({ id })) } : undefined,
      },
      include: { permissions: { select: { name: true } } },
    });

    return NextResponse.json({ data: role }, { status: 201 });
  } catch (error) {
    console.error('Failed to create role:', error);
    return NextResponse.json({ error: 'Failed to create role' }, { status: 400 });
  }
}
