import type { Metadata } from 'next';
import AppShell from '@/components/AppShell';
import Providers from '@/components/Providers';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Nib Legal',
  description: 'Contract Management System (CMS) and Legal Advisory & Human Development (LAHD) platform for Nib International Bank S.C.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet" />
        {/* Resolve the stored theme before first paint so dark-theme users do not
            get a flash of the light palette while React hydrates. Mirrors the
            logic in AppShell. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('nib-theme')||'light';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.setAttribute('data-theme',r);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
      </head>
      <body>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
        </Providers>
      </body>
    </html>
  );
}
