'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, Sun, Moon, Monitor, Plus, ChevronRight, Menu } from 'lucide-react';
import { currentUser, logout } from '@/data/store';
import { ROLE_LABELS } from '@/utils/formatters';

interface TopNavProps {
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  setMobileOpen: (v: boolean) => void;
}

export default function TopNav({ theme, setTheme, setMobileOpen }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
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
      height: 70,
      background: 'color-mix(in srgb, var(--bg-card) 82%, transparent)',
      backdropFilter: 'saturate(180%) blur(12px)',
      WebkitBackdropFilter: 'saturate(180%) blur(12px)',
      borderBottom: '1px solid var(--border)',
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
              background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
              boxShadow: searchFocused ? '0 0 0 3px var(--accent-glow)' : 'none',
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
                background: 'var(--primary)', color: '#3B2718', border: 'none', borderRadius: 20,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 10px var(--accent-glow)'
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
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => {
              const dropdown = document.getElementById('profile-dropdown');
              if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
              }
            }}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, 
              borderLeft: '1px solid var(--border)', background: 'none', border: 'none', 
              borderLeftWidth: '1px', borderLeftColor: 'var(--border)', borderLeftStyle: 'solid',
              cursor: 'pointer' 
            }}
          >
            <div style={{ textAlign: 'right', display: 'none' }} className="sm:block">
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{currentUser.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ROLE_LABELS[currentUser.role]}</div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--success))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          </button>
          
          <div 
            id="profile-dropdown"
            className="card"
            style={{
              display: 'none',
              position: 'absolute', top: '100%', right: 0, marginTop: 12, width: 220,
              padding: 8, zIndex: 50, boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}
          >
            <Link 
              href="/profile" 
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-secondary hover:bg-card-hover hover:text-primary transition-colors"
              onClick={() => { document.getElementById('profile-dropdown')!.style.display = 'none'; }}
            >
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              My Profile
            </Link>
            
            <div className="h-px bg-border my-2" />
            
            <button 
              onClick={() => {
                logout();
                document.getElementById('profile-dropdown')!.style.display = 'none';
                router.push('/login');
              }}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-danger hover:bg-danger/10 transition-colors bg-transparent border-none cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
