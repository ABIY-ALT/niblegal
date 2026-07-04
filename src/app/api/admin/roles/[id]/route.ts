import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  if (!['manager', 'admin_assistant'].includes(user.role)) return { error: 'Forbidden', status: 403 as const };
  return { user };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { name, permissionIds } = await req.json();

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(name?.trim() ? { name: name.trim() } : {}),
        ...(Array.isArray(permissionIds)
          ? { permissions: { set: permissionIds.map((pid: string) => ({ id: pid })) } }
          : {}),
      },
      include: { permissions: { select: { id: true, name: true } }, _count: { select: { users: true } } },
    });

    return NextResponse.json({
      data: {
        id: role.id,
        name: role.name,
        userCount: role._count.users,
        permissions: role.permissions.map((p) => p.name),
        permissionIds: role.permissions.map((p) => p.id),
      },
    });
  } catch (error) {
    console.error('Failed to update role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });
  if (role._count.users > 0) {
    return NextResponse.json({ error: `Cannot delete: ${role._count.users} user(s) still hold this role` }, { status: 400 });
  }

  await prisma.role.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
