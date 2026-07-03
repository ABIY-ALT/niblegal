import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('nib_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    const hashedNew = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashedNew } });

    // Audit log
    await prisma.auditLog.create({
      data: { module: 'SYSTEM', action: 'PASSWORD_CHANGED', details: `Password changed for user ${user.firstName} ${user.lastName}`, userId: user.id },
    });

    // Clear session to force re-login
    cookieStore.delete('nib_session');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CHANGE PASSWORD ERROR]:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
