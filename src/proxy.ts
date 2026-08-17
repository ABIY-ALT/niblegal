import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJwt } from '@/lib/jwt';

// Public routes that unauthenticated users can access
const PUBLIC_PATHS = [
  '/login',
  '/change-password',
  '/api/auth/login',
  '/api/auth/mfa',
  '/api/auth/logout',
  '/api/auth/me',
  // Scheduled job endpoint. Not actually open: the route itself requires a
  // matching `x-cron-secret` header or a signed-in manager. It has to bypass
  // the cookie check here because the scheduler runs headless, with no session.
  '/api/system/jobs',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, next internal files, and images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Read and verify JWT token from cookie
  const token = request.cookies.get('nib_token')?.value;
  const payload = token ? await verifyJwt(token) : null;
  const isAuthenticated = !!payload;

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // 3. Handle root route '/'
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 4. If user is authenticated and tries to visit '/login'
  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 5. If user is not authenticated and attempts to access protected routes
  if (!isAuthenticated && !isPublicPath) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/dashboard') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
