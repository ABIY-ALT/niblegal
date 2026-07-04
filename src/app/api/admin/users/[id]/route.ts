import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

const DEFAULT_PASSWORD = 'ChangeMe123!';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  if (!['manager', 'admin_assistant'].includes(user.role)) return { error: 'Forbidden', status: 403 as const };
  return { user };
}

/**
 * Update a user. Supports field edits plus two actions via `action`:
 *   'toggle-active'  → flip isActive   'reset-password' → reset to the default temp password
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (body.action === 'toggle-active') {
      const updated = await prisma.user.update({ where: { id }, data: { isActive: !existing.isActive } });
      await prisma.auditLog.create({ data: { module: 'SYSTEM', action: updated.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', details: `${existing.email} ${updated.isActive ? 'activated' : 'deactivated'} by ${auth.user.name}`, userId: auth.user.id } });
      return NextResponse.json({ data: { isActive: updated.isActive } });
    }

    if (body.action === 'reset-password') {
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
      await prisma.user.update({ where: { id }, data: { passwordHash } });
      await prisma.auditLog.create({ data: { module: 'SYSTEM', action: 'USER_PASSWORD_RESET', details: `Password reset for ${existing.email} by ${auth.user.name}`, userId: auth.user.id } });
      return NextResponse.json({ data: { reset: true, tempPassword: DEFAULT_PASSWORD } });
    }

    const { firstName, lastName, email, roleId, departmentId, isActive } = body;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(firstName?.trim() ? { firstName: firstName.trim() } : {}),
        ...(lastName?.trim() ? { lastName: lastName.trim() } : {}),
        ...(email?.trim() ? { email: email.trim().toLowerCase() } : {}),
        ...(roleId ? { roleId } : {}),
        ...(departmentId !== undefined ? { departmentId: departmentId || null } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: { role: { select: { id: true, name: true } }, department: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      data: {
        id: updated.id, name: `${updated.firstName} ${updated.lastName}`, email: updated.email,
        isActive: updated.isActive, roleId: updated.role.id, roleName: updated.role.name,
        departmentId: updated.department?.id ?? null, departmentName: updated.department?.name ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  if (id === auth.user.id) return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });

  // Deactivate rather than hard-delete to preserve audit/history references.
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true, deactivated: true });
}
