import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { hasAccess } from '@/lib/access';
import { ensurePermissions, groupOf } from '@/lib/permissions';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasAccess(user, { permission: 'admin.roles', roles: ['manager', 'admin_assistant'] })) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensurePermissions();
  const permissions = await prisma.permission.findMany({ orderBy: { name: 'asc' } });

  return NextResponse.json({
    data: permissions.map((p) => ({ ...p, group: groupOf(p.name) })),
  });
}
