'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './layout/Sidebar';
import TopNav from './layout/TopNav';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type Theme = 'dark' | 'light' | 'system';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  const { data: currentUser, isLoading } = useCurrentUser();
  
  // Layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthRoute = pathname === '/login' || pathname === '/change-password';

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('nib-theme') as Theme | null;
    if (saved) setTheme(saved);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Client-side authentication guard
  useEffect(() => {
    if (!isAuthRoute && !isLoading && currentUser === null) {
      router.replace('/login');
    }
  }, [isAuthRoute, isLoading, currentUser, router]);

  // `system` has to be resolved to a concrete light/dark value: the stylesheet
  // only defines [data-theme="light"] / [data-theme="dark"], so writing
  // data-theme="system" silently fell back to the light palette and never
  // followed the OS setting.
  useEffect(() => {
    if (!mounted) return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
      document.documentElement.setAttribute('data-theme', resolved);
    };

    apply();
    localStorage.setItem('nib-theme', theme);

    if (theme !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme, mounted]);

  if (isAuthRoute) {
    return <>{children}</>;
  }

  // If loading or unauthenticated on protected route, show clean loading state
  if (isLoading || !currentUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--background)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="app-shell" style={{ display: 'flex', minHeight: '100vh', background: 'var(--background)' }}>
      
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      <div
        className={`main-area flex flex-col min-h-screen ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}
      >
        <TopNav 
          theme={theme} 
          setTheme={setTheme} 
          setMobileOpen={setMobileOpen} 
        />

        <main className="page-content">
          {children}
        </main>
      </div>
      
    </div>
  );
}

