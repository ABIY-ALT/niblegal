'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, Menu, X, Users, LogOut } from 'lucide-react';
import { NAVIGATION, NavItem } from '@/config/navigation';
import { currentUser, USERS, setCurrentUser, getCMSStats, getLAHDStats } from '@/data/store';
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
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-expand menus based on current pathname
    const newExpanded = { ...expandedMenus };
    NAVIGATION.forEach(item => {
      if (item.submenu?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'))) {
        newExpanded[item.title] = true;
      }
    });
    setExpandedMenus(newExpanded);
  }, [pathname]);

  if (!mounted) return null;

  const toggleSubmenu = (title: string) => {
    if (collapsed) setCollapsed(false);
    setExpandedMenus(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const switchUser = (userId: string) => {
    setCurrentUser(userId);
    setShowRoleSwitcher(false);
    window.location.reload();
  };

  const getBadgeValue = (badge?: string | number) => {
    if (!badge) return null;
    if (typeof badge === 'number') return badge;
    if (badge === 'pending') {
      return getCMSStats().pendingApproval + getLAHDStats().pendingApproval;
    }
    if (badge === 'critical') {
      return getCMSStats().expiringSoon + getLAHDStats().slaBreached;
    }
    return null;
  };

  const renderBadge = (badge?: string | number) => {
    const val = getBadgeValue(badge);
    if (!val || val === 0) return null;
    const isCritical = badge === 'critical';
    return (
      <span style={{ 
        background: isCritical ? 'var(--danger)' : 'var(--warning)', 
        color: '#fff', 
        fontSize: '10px', 
        fontWeight: 700, 
        padding: '2px 6px', 
        borderRadius: '10px',
        marginLeft: 'auto'
      }}>
        {val}
      </span>
    );
  };

  const filteredNav = NAVIGATION.filter(item => item.roles.includes(currentUser.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }} 
        />
      )}

      <aside className={`sidebar md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'md:w-[80px]' : 'md:w-[280px]'} w-[280px]`} style={{ 
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column'
      }}>
        {/* Logo */}
        <div style={{ height: 70, display: 'flex', alignItems: 'center', padding: collapsed ? '0' : '0 24px', justifyContent: collapsed ? 'center' : 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, var(--gold-light), var(--gold))',
              color: '#0b0e1a', fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(212,168,71,0.3)', flexShrink: 0
            }}>N</div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.2 }}>Nib Bank</strong>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Legal Automation</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="btn btn-ghost btn-sm" style={{ padding: 4 }}>
              <Menu size={18} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {collapsed && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
               <button onClick={() => setCollapsed(false)} className="btn btn-ghost btn-sm" style={{ padding: 8 }}>
                <Menu size={20} />
              </button>
            </div>
          )}

          {filteredNav.map((item, idx) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isExpanded = expandedMenus[item.title];
            const isActive = item.href 
              ? pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/dashboard')
              : item.submenu?.some(sub => pathname === sub.href || pathname.startsWith(sub.href + '/'));
            
            const itemContent = (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', 
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
                background: isActive && !hasSubmenu ? 'var(--accent-glow)' : 'transparent',
                color: isActive && !hasSubmenu ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500, transition: 'all 0.2s',
                justifyContent: collapsed ? 'center' : 'flex-start'
              }} className="nav-item-hover">
                <div style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }} title={collapsed ? item.title : undefined}>
                  {item.icon}
                </div>
                {!collapsed && <span style={{ flex: 1 }}>{item.title}</span>}
                {!collapsed && renderBadge(item.badge)}
                {!collapsed && hasSubmenu && (
                  isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                )}
              </div>
            );

            return (
              <div key={idx}>
                {hasSubmenu ? (
                  <div onClick={() => toggleSubmenu(item.title)}>
                    {itemContent}
                  </div>
                ) : (
                  <Link href={item.href!} style={{ textDecoration: 'none' }}>
                    {itemContent}
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && isExpanded && !collapsed && (
                  <div style={{ display: 'flex', flexDirection: 'column', marginTop: 4, paddingLeft: 38, gap: 2 }}>
                    {item.submenu!.filter(s => s.roles.includes(currentUser.role)).map((sub, sIdx) => {
                      const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                      return (
                        <Link key={sIdx} href={sub.href!} style={{ textDecoration: 'none' }}>
                          <div style={{ 
                            padding: '8px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13,
                            background: isSubActive ? 'rgba(37,99,235,0.05)' : 'transparent',
                            color: isSubActive ? 'var(--accent)' : 'var(--text-muted)',
                            fontWeight: isSubActive ? 600 : 500, display: 'flex', alignItems: 'center',
                            transition: 'all 0.2s'
                          }} className="nav-subitem-hover">
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
          })}
        </nav>

        {/* User Profile */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
          <div 
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px', 
              borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start'
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ROLE_LABELS[currentUser.role]}</div>
              </div>
            )}
            {!collapsed && <Users size={14} color="var(--text-muted)" />}
          </div>

          {showRoleSwitcher && !collapsed && (
            <div style={{ marginTop: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'absolute', bottom: 70, left: 12, right: 12 }}>
              <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Switch Role (Demo)</div>
              {USERS.slice(0, 7).map(u => (
                <button key={u.id} onClick={() => switchUser(u.id)} style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '10px 12px', background: currentUser.id === u.id ? 'var(--accent-glow)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ROLE_LABELS[u.role]}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
