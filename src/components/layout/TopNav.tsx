'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Sun, Moon, Monitor, Plus, ChevronRight, Menu } from 'lucide-react';
import { currentUser } from '@/data/store';
import { ROLE_LABELS } from '@/utils/formatters';

interface TopNavProps {
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  setMobileOpen: (v: boolean) => void;
}

export default function TopNav({ theme, setTheme, setMobileOpen }: TopNavProps) {
  const pathname = usePathname();
  const [searchFocused, setSearchFocused] = useState(false);

  // Generate Breadcrumbs
  const generateBreadcrumbs = () => {
    const paths = pathname.split('/').filter(p => p);
    if (paths.length === 0) return [{ label: 'Dashboard', href: '/dashboard' }];
    
    return paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      return { label, href };
    });
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header style={{ 
      height: 70, background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', position: 'sticky', top: 0, zIndex: 40
    }}>
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button 
          className="md:hidden btn btn-ghost" 
          onClick={() => setMobileOpen(true)}
          style={{ padding: 8 }} 
        >
          <Menu size={20} />
        </button>

        <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}>
          {breadcrumbs.map((bc, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {idx > 0 && <ChevronRight size={14} color="var(--text-muted)" />}
              <Link href={bc.href} style={{ 
                color: idx === breadcrumbs.length - 1 ? 'var(--text-primary)' : 'var(--text-muted)',
                textDecoration: 'none'
              }}>
                {bc.label}
              </Link>
            </div>
          ))}
        </nav>
      </div>

      {/* Center: Global Search */}
      <div style={{ flex: 1, maxWidth: 480, margin: '0 32px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} color={searchFocused ? 'var(--accent)' : 'var(--text-muted)'} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s' }} />
          <input 
            type="text" 
            placeholder="Search contracts, requests, officers..." 
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{ 
              width: '100%', padding: '10px 16px 10px 44px', borderRadius: 20, 
              border: `1px solid ${searchFocused ? 'var(--accent)' : 'var(--border)'}`, 
              background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              boxShadow: searchFocused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          />
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        
        {/* Quick Create Button */}
        {['manager', 'legal_officer', 'requesting_organ'].includes(currentUser.role) && (
          <div className="dropdown" style={{ position: 'relative' }}>
            <Link href={currentUser.role === 'requesting_organ' ? '/contracts/new' : '/contracts/new'} style={{ textDecoration: 'none' }}>
              <button style={{ 
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 20,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 10px rgba(37,99,235,0.2)'
              }} className="hover:scale-105 transition-all">
                <Plus size={16} /> New
              </button>
            </Link>
          </div>
        )}

        {/* Theme Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 20, padding: 2, border: '1px solid var(--border)' }}>
          <button onClick={() => setTheme('light')} style={{ padding: '6px 12px', borderRadius: 18, border: 'none', background: theme === 'light' ? 'var(--bg-card)' : 'transparent', color: theme === 'light' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', boxShadow: theme === 'light' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
            <Sun size={14} />
          </button>
          <button onClick={() => setTheme('system')} style={{ padding: '6px 12px', borderRadius: 18, border: 'none', background: theme === 'system' ? 'var(--bg-card)' : 'transparent', color: theme === 'system' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', boxShadow: theme === 'system' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
            <Monitor size={14} />
          </button>
          <button onClick={() => setTheme('dark')} style={{ padding: '6px 12px', borderRadius: 18, border: 'none', background: theme === 'dark' ? 'var(--bg-card)' : 'transparent', color: theme === 'dark' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', boxShadow: theme === 'dark' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
            <Moon size={14} />
          </button>
        </div>

        {/* Notifications */}
        <Link href="/notifications" style={{ position: 'relative', padding: 8, color: 'var(--text-muted)' }} className="hover:text-primary transition-colors">
          <Bell size={20} />
          <span style={{ 
            position: 'absolute', top: 4, right: 6, width: 8, height: 8, 
            background: 'var(--danger)', borderRadius: '50%', border: '2px solid var(--bg-card)' 
          }} />
        </Link>

        {/* Profile Dropdown Toggle */}
        <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'right', display: 'none' }} className="sm:block">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{currentUser.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ROLE_LABELS[currentUser.role]}</div>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
            {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
        </Link>
      </div>
    </header>
  );
}
