'use client';

import UserManagement from '@/components/admin/UserManagement';
import { RoleGuard } from '@/components/advisory/RoleGuard';

export default function AdminUsersPage() {
  return (
    <RoleGuard roles={['manager', 'admin_assistant']} permission="admin.users">
      <UserManagement />
    </RoleGuard>
  );
}
