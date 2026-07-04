'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './layout/Sidebar';
import TopNav from './layout/TopNav';

type Theme = 'dark' | 'light' | 'system';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  
  // Layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('nib-theme') as Theme;
    if (saved) setTheme(saved);
    
    // Close mobile menu on route change
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mounted) {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('nib-theme', theme);
    }
  }, [theme, mounted]);

  const isAuthRoute = pathname === '/login' || pathname === '/change-password';

  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Determine main area padding/margin based on sidebar state
  // On mobile (max-width: 768px typically), we handle margin via CSS media queries.
  // We'll add classes and inline styles that CSS can override.

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      <div
        className={`main-area flex flex-col min-h-screen w-full ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      >
        <TopNav 
          theme={theme} 
          setTheme={setTheme} 
          setMobileOpen={setMobileOpen} 
        />

        <main className="page-content" style={{ flex: 1, padding: '24px 32px', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
      
    </div>
  );
}

