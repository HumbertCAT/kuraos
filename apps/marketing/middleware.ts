import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/navigation';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale
});

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes - allow access without authentication
  const isPublicFormRoute = pathname.includes('/f/');
  const isPublicBookingRoute = pathname.includes('/book/');
  if (isPublicFormRoute || isPublicBookingRoute) {
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
  
  if (isProtectedRoute && !hasToken) {
    // Get locale from pathname
    const pathLocale = pathname.split('/')[1];
    const locale = locales.includes(pathLocale as any) ? pathLocale : defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect logged-in users away from auth pages
  const isAuthRoute = pathname.includes('/login') || pathname.includes('/register');
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
