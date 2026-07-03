'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Shield, Building, GitMerge, List, Settings } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  const nav = [
    { href: '/admin/users', label: 'User Management', icon: <Users size={16} /> },
    { href: '/admin/roles', label: 'Role Security', icon: <Shield size={16} /> },
    { href: '/admin/departments', label: 'Departments', icon: <Building size={16} /> },
    { href: '/admin/workflows', label: 'Workflows', icon: <GitMerge size={16} /> },
    { href: '/admin/audit-logs', label: 'Audit Trail', icon: <List size={16} /> },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Admin Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={24} color="var(--accent)" /> System Administration
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: 13 }}>Manage users, security roles, organizational structure, and workflows.</p>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="tabs-bar" style={{ marginBottom: 10 }}>
        {nav.map(link => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} className={`tab-btn ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
              {link.icon} {link.label}
            </Link>
          );
        })}
      </div>

      {/* Admin Content Area */}
      <div>
        {children}
      </div>
    </div>
  );
}
