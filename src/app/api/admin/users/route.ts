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

function shape(u: {
  id: string; firstName: string; lastName: string; email: string; isActive: boolean; mfaEnabled: boolean;
  createdAt: Date; role: { id: string; name: string }; department: { id: string; name: string } | null;
}) {
  return {
    id: u.id,
    name: `${u.firstName} ${u.lastName}`,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    isActive: u.isActive,
    mfaEnabled: u.mfaEnabled,
    roleId: u.role.id,
    roleName: u.role.name,
    departmentId: u.department?.id ?? null,
    departmentName: u.department?.name ?? null,
    createdAt: u.createdAt,
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const users = await prisma.user.findMany({
    orderBy: [{ firstName: 'asc' }],
    include: { role: { select: { id: true, name: true } }, department: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ data: users.map(shape) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { firstName, lastName, email, roleId, departmentId, password, isActive } = await req.json();
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !roleId) {
      return NextResponse.json({ error: 'First name, last name, email, and role are required' }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (exists) return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 400 });

    const passwordHash = await bcrypt.hash(password?.trim() || DEFAULT_PASSWORD, 12);

    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        passwordHash,
        roleId,
        departmentId: departmentId || null,
        isActive: isActive ?? true,
      },
      include: { role: { select: { id: true, name: true } }, department: { select: { id: true, name: true } } },
    });

    await prisma.auditLog.create({
      data: { module: 'SYSTEM', action: 'USER_CREATED', details: `User ${user.email} created by ${auth.user.name}`, userId: auth.user.id },
    });

    return NextResponse.json({ data: shape(user) }, { status: 201 });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
  }
}
