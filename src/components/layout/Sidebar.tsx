'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { NAV_GROUPS, NavItem } from '@/config/navigation';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { hasAccess } from '@/lib/access';
import { ROLE_LABELS } from '@/utils/formatters';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const { data: currentUser } = useCurrentUser();

  const { data: navStats } = useQuery({
    queryKey: ['nav-badges'],
    queryFn: async () => {
      const [contractsRes, advisoryRes] = await Promise.all([
        fetch('/api/contracts/stats'),
        fetch('/api/advisory/stats'),
      ]);
      const contracts = await contractsRes.json();
      const advisory = await advisoryRes.json();
      return {
        pending: (contracts.summary?.pendingApproval ?? 0) + (advisory.summary?.pendingApproval ?? 0),
        critical: (contracts.summary?.expiring ?? 0) + (advisory.summary?.slaBreached ?? 0),
      };
    },
    enabled: !!currentUser && currentUser.role !== 'requesting_organ',
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    setMounted(true);
    const newExpanded = { ...expandedMenus };
    NAV_GROUPS.forEach(group => {
      group.items.forEach(item => {
        if (item.submenu?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'))) {
          newExpanded[item.title] = true;
        }
      });
    });
    setExpandedMenus(newExpanded);
  }, [pathname]);

  if (!mounted || !currentUser) return null;

  const toggleSubmenu = (title: string) => {
    if (collapsed) setCollapsed(false);
    setExpandedMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const getBadgeValue = (badge?: string | number) => {
    if (!badge) return null;
    if (typeof badge === 'number') return badge;
    if (badge === 'pending') return navStats?.pending ?? null;
    if (badge === 'critical') return navStats?.critical ?? null;
    return null;
  };

  const renderBadge = (badge?: string | number) => {
    const val = getBadgeValue(badge);
    if (!val || val === 0) return null;
    const isCritical = badge === 'critical';
    return (
      <span style={{
        background: isCritical ? 'var(--danger)' : 'var(--warning)',
        color: '#fff', fontSize: '10px', fontWeight: 700,
        padding: '2px 6px', borderRadius: '10px', marginLeft: 'auto', flexShrink: 0
      }}>
        {val}
      </span>
    );
  };

  const renderNavItem = (item: NavItem, idx: number) => {
    if (!hasAccess(currentUser, item)) return null;
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.title];
    const isActive = item.href
      ? pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
      : item.submenu?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'));

    const itemContent = (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px',
        borderRadius: 8, cursor: 'pointer',
        background: isActive && !hasSubmenu
          ? 'linear-gradient(135deg, var(--gold-light), var(--primary))'
          : 'transparent',
        color: isActive && !hasSubmenu ? '#3B2718' : 'rgba(255,255,255,0.82)',
        fontWeight: isActive ? 600 : 500,
        fontSize: 13,
        transition: 'all 0.2s',
        boxShadow: isActive && !hasSubmenu ? '0 3px 10px rgba(234,179,8,0.25)' : 'none',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }} className="nav-item-brown">
        <div style={{ color: isActive && !hasSubmenu ? '#3B2718' : 'rgba(255,255,255,0.65)', flexShrink: 0 }} title={collapsed ? item.title : undefined}>
          {item.icon}
        </div>
        {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</span>}
        {!collapsed && renderBadge(item.badge)}
        {!collapsed && hasSubmenu && (
          isExpanded
            ? <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
            : <ChevronRight size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
        )}
      </div>
    );

    return (
      <div key={idx}>
        {hasSubmenu ? (
          <div onClick={() => toggleSubmenu(item.title)}>{itemContent}</div>
        ) : (
          <Link href={item.href!} style={{ textDecoration: 'none' }}>{itemContent}</Link>
        )}

        {hasSubmenu && isExpanded && !collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 2, paddingLeft: 36, gap: 1 }}>
            {item.submenu!.filter(s => hasAccess(currentUser, s)).map((sub, sIdx) => {
              const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
              return (
                <Link key={sIdx} href={sub.href!} style={{ textDecoration: 'none' }}>
                  <div style={{
                    padding: '7px 10px', borderRadius: 6, fontSize: 12.5,
                    background: isSubActive ? 'rgba(234,179,8,0.16)' : 'transparent',
                    color: isSubActive ? 'var(--gold-light)' : 'rgba(255,255,255,0.55)',
                    fontWeight: isSubActive ? 600 : 400,
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.15s',
                    borderLeft: isSubActive ? '2px solid var(--gold-light)' : '2px solid transparent',
                  }} className="nav-subitem-brown">
                    <span style={{ flex: 1 }}>{sub.title}</span>
                    {renderBadge(sub.badge)}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          /* Above the sticky top bar (z 40), below the drawer itself (z 50). */
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }}
        />
      )}

      <aside className={`sidebar md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'md:w-[72px]' : 'md:w-[260px]'} w-[260px]`} style={{
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        background: 'linear-gradient(180deg, #2A1B10 0%, #1e1309 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '4px 0 20px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Logo */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          padding: collapsed ? '0' : '0 16px',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0,
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'linear-gradient(135deg, #FBBF24, #EAB308)',
                color: '#3B2718', fontWeight: 800, fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 3px 10px rgba(234,179,8,0.3)', flexShrink: 0,
              }}>N</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: 14, color: '#fff', lineHeight: 1.2, fontWeight: 700 }}>Nib Bank</strong>
                <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.3px' }}>Legal Automation</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ padding: 7, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', borderRadius: 7, display: 'flex' }}
            title="Toggle sidebar"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {NAV_GROUPS.map((group, gIdx) => {
            const visibleItems = group.items.filter(item => hasAccess(currentUser, item));
            if (visibleItems.length === 0) return null;
            return (
              <div key={gIdx} style={{ marginBottom: 4 }}>
                {group.groupLabel && !collapsed && (
                  <div style={{
                    fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '1.1px', textTransform: 'uppercase',
                    padding: '14px 11px 5px',
                  }}>
                    {group.groupLabel}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {visibleItems.map((item, idx) => renderNavItem(item, idx))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div style={{ padding: '10px 8px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <Link
            href="/profile"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px',
              textDecoration: 'none', borderRadius: 8,
              background: 'rgba(255,255,255,0.06)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'background 0.2s',
            }}
            className="nav-item-brown"
          >
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #A16207, #15803D)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ROLE_LABELS[currentUser.role]}</div>
              </div>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
}
