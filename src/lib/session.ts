import { cookies } from 'next/headers';
import { verifyJwt } from '@/lib/jwt';
import prisma from '@/lib/prisma';
import type { UserRole } from '@/types';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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
    include: { department: true },
  });
  if (!dbUser || !dbUser.isActive) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: `${dbUser.firstName} ${dbUser.lastName}`,
    role: payload.role as UserRole,
    departmentId: dbUser.departmentId,
    departmentName: dbUser.department?.name ?? null,
  };
}

export function hasRole(user: SessionUser | null, roles: UserRole[]): boolean {
  return !!user && roles.includes(user.role);
}
