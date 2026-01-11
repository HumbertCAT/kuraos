import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/navigation';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files (PWA assets, icons, etc.)
  if (
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/apple-touch-icon') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/_next/')
  ) {
    return NextResponse.next();
  }
  
  // Skip middleware for API routes (including NextAuth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // ROOT REDIRECT: / or /locale should go to login (no landing in platform)
  if (pathname === '/' || pathname.match(/^\/[a-z]{2}$/)) {
    const pathLocale = pathname.split('/')[1];
    const locale = locales.includes(pathLocale as any) ? pathLocale : defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
  
  // Public routes - allow access without authentication
  const isPublicFormRoute = pathname.includes('/f/');
  const isPublicBookingRoute = pathname.includes('/book/');
  const isPasswordRoute = pathname.includes('/forgot-password') || pathname.includes('/reset-password');
  if (isPublicFormRoute || isPublicBookingRoute || isPasswordRoute) {
    return intlMiddleware(request);
  }
  
  // Check if route is protected (dashboard)
  const isProtectedRoute = pathname.includes('/dashboard') || 
    pathname.includes('/patients') || 
    pathname.includes('/calendar') ||
    pathname.includes('/observatory') ||
    pathname.includes('/settings') ||
    pathname.includes('/admin');
    
  const hasToken = request.cookies.has('access_token');
  
  // Debug logging
  console.log('[Middleware]', {
    pathname,
    hasToken,
    isProtectedRoute,
    cookies: request.cookies.getAll().map(c => c.name)
  });
  
  if (isProtectedRoute && !hasToken) {
    // Get locale from pathname
    const pathLocale = pathname.split('/')[1];
    const locale = locales.includes(pathLocale as any) ? pathLocale : defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from auth pages
  const isAuthRoute = pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/forgot-password') || pathname.includes('/reset-password');
  if (isAuthRoute && hasToken) {
    const pathLocale = pathname.split('/')[1];
    const locale = locales.includes(pathLocale as any) ? pathLocale : defaultLocale;
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(es|en|ca|it)/:path*']
};
