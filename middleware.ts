import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/sign-in', 
  '/sign-up', 
  '/api', 
  '/'
];

const PUBLIC_FILE_PATTERN = /\.(.*)$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public files, API routes, and specific paths
  if (
    PUBLIC_FILE_PATTERN.test(pathname) || 
    pathname.startsWith('/api/') || 
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico' ||
    PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'))
  ) {
    return NextResponse.next();
  }
  
  // Check for session cookie
  const hasSessionCookie = request.cookies.has('session');
  
  // For dashboard routes, require authentication
  if (pathname.startsWith('/dashboard')) {
    if (!hasSessionCookie) {
      console.log(`[Middleware] Redirecting to /sign-in: No session cookie for path ${pathname}`);
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
