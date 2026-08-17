'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Sun, Moon, Monitor, ChevronRight, Menu, LogOut, User, Settings } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ROLE_LABELS } from '@/utils/formatters';

interface TopNavProps {
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  setMobileOpen: (v: boolean) => void;
}

export default function TopNav({ theme, setTheme, setMobileOpen }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [profileOpen, setProfileOpen] = useState(false);
  const { data: currentUser } = useCurrentUser();

  const { data: notifData } = useQuery({
    queryKey: ['notifications-summary'],
    queryFn: async () => {
      const res = await fetch('/api/notifications?limit=1');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!currentUser,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
  const unreadCount: number = notifData?.stats?.unreadNotifications ?? 0;

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    queryClient.clear();
    router.push('/login');
  };

  if (!currentUser) return null;

  const breadcrumbs = (() => {
    const paths = pathname.split('/').filter(p => p);
    if (paths.length === 0) return [{ label: 'Dashboard', href: '/dashboard' }];
    return paths.map((path, index) => ({
      href: '/' + paths.slice(0, index + 1).join('/'),
      label: path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' '),
    }));
  })();

  const initials = currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <header style={{
      height: 64,
      background: 'color-mix(in srgb, var(--bg-card) 90%, transparent)',
      backdropFilter: 'saturate(180%) blur(12px)',
      WebkitBackdropFilter: 'saturate(180%) blur(12px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
    }} className="topbar-bar">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        <button
          aria-label="Open navigation menu"
          className="md:hidden"
          onClick={() => setMobileOpen(true)}
          style={{ padding: 7, background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 7, display: 'flex' }}
        >
          <Menu size={18} />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="hidden md:flex"
          style={{ alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 500, minWidth: 0, overflow: 'hidden' }}
        >
          {breadcrumbs.map((bc, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {idx > 0 && <ChevronRight size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
              <Link
                href={bc.href}
                aria-current={idx === breadcrumbs.length - 1 ? 'page' : undefined}
                style={{
                  color: idx === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
                  textDecoration: 'none',
                  fontWeight: idx === breadcrumbs.length - 1 ? 600 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 180,
                }}
              >
                {bc.label}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

        {/* Theme Switcher */}
        <div
          role="group"
          aria-label="Colour theme"
          style={{
            display: 'flex', background: 'var(--bg-input)', borderRadius: 8,
            padding: 2, border: '1px solid var(--border)', gap: 1,
          }}
        >
          {([
            { mode: 'light' as const, icon: <Sun size={13} /> },
            { mode: 'system' as const, icon: <Monitor size={13} /> },
            { mode: 'dark' as const, icon: <Moon size={13} /> },
          ]).map(({ mode, icon }) => (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              title={mode.charAt(0).toUpperCase() + mode.slice(1)}
              aria-label={`${mode.charAt(0).toUpperCase() + mode.slice(1)} theme`}
              aria-pressed={theme === mode}
              style={{
                padding: '5px 9px', borderRadius: 6, border: 'none',
                background: theme === mode ? 'var(--bg-card)' : 'transparent',
                color: theme === mode ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                boxShadow: theme === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* Notifications Bell */}
        <Link
          href="/notifications"
          style={{
            position: 'relative', padding: 8, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, background: 'transparent', textDecoration: 'none',
            transition: 'background 0.15s, color 0.15s',
          }}
          className="hover:bg-bg-input hover:text-primary"
          title="Notifications"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: 5, right: 5,
              width: 7, height: 7,
              background: 'var(--danger)', borderRadius: '50%',
              border: '2px solid var(--bg-card)',
            }} />
          )}
        </Link>

        {/* Settings shortcut */}
        <Link
          href="/admin/settings"
          style={{
            padding: 8, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, textDecoration: 'none',
            transition: 'background 0.15s, color 0.15s',
          }}
          className="hover:bg-bg-input hover:text-primary"
          title="Settings"
        >
          <Settings size={18} />
        </Link>

        {/* Profile */}
        <div style={{ position: 'relative', marginLeft: 4 }}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            aria-label={`Account menu for ${currentUser.name}`}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '5px 10px 5px 6px',
              background: 'var(--bg-input)', border: '1px solid var(--border)',
              borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            className="hover:border-accent"
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #A16207, #15803D)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {initials}
            </div>
            {/* `display:'none'` inline beat the `sm:block` class at every width,
                so the name/role never rendered. Use classes for both states. */}
            <div style={{ textAlign: 'left' }} className="hidden sm:block">
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{currentUser.name}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{ROLE_LABELS[currentUser.role]}</div>
            </div>
          </button>

          {profileOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setProfileOpen(false)} />
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, width: 210, padding: 6,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 50,
              }}>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{currentUser.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{ROLE_LABELS[currentUser.role]}</div>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 12px', borderRadius: 7,
                    fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
                    textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
                  }}
                  className="hover:bg-bg-input hover:text-primary"
                >
                  <User size={15} /> My Profile
                </Link>
                <Link
                  href="/admin/settings"
                  onClick={() => setProfileOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 12px', borderRadius: 7,
                    fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
                    textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
                  }}
                  className="hover:bg-bg-input hover:text-primary"
                >
                  <Settings size={15} /> Settings
                </Link>
                <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
                <button
                  onClick={logout}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                    padding: '8px 12px', borderRadius: 7,
                    fontSize: 13, fontWeight: 500, color: 'var(--danger)',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    transition: 'background 0.15s',
                    textAlign: 'left',
                  }}
                  className="hover:bg-danger/10"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
