// =============================================================================
// CivicConnect TN — Next.js Edge Middleware (Route Protection & Role Guards)
// =============================================================================
// Intercepts all requests and enforces authentication & role permissions before
// any page rendering or route execution.

import { NextResponse, type NextRequest } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { UserRole } from '@/types/enums';
import { getRoleHomePath } from '@/config/roles';

// Route access definitions
const ROLE_ROUTE_PERMISSIONS: { prefix: string; allowedRoles: UserRole[] }[] = [
  {
    prefix: '/field',
    allowedRoles: [UserRole.FIELD_WORKER, UserRole.ADMIN],
  },
  {
    prefix: '/dashboard/field-worker',
    allowedRoles: [UserRole.FIELD_WORKER, UserRole.ADMIN],
  },
  {
    prefix: '/dashboard/area-officer',
    allowedRoles: [UserRole.AREA_OFFICER, UserRole.ADMIN],
  },
  {
    prefix: '/dashboard/dept-head',
    allowedRoles: [UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
  },
  {
    prefix: '/dashboard/department-head',
    allowedRoles: [UserRole.DEPARTMENT_HEAD, UserRole.ADMIN],
  },
  {
    prefix: '/dashboard/commissioner',
    allowedRoles: [UserRole.CITY_COMMISSIONER, UserRole.ADMIN],
  },
  {
    prefix: '/dashboard/collector',
    allowedRoles: [UserRole.DISTRICT_COLLECTOR, UserRole.ADMIN],
  },
  {
    prefix: '/dashboard/district-collector',
    allowedRoles: [UserRole.DISTRICT_COLLECTOR, UserRole.ADMIN],
  },
  {
    prefix: '/dashboard/secretary',
    allowedRoles: [UserRole.DEPARTMENT_SECRETARY, UserRole.ADMIN],
  },
  {
    prefix: '/dashboard/department-secretary',
    allowedRoles: [UserRole.DEPARTMENT_SECRETARY, UserRole.ADMIN],
  },
  {
    prefix: '/dashboard/chief-secretary',
    allowedRoles: [UserRole.CHIEF_SECRETARY, UserRole.ADMIN],
  },
  {
    prefix: '/dashboard/chief-minister',
    allowedRoles: [UserRole.CHIEF_MINISTER, UserRole.ADMIN],
  },
  {
    prefix: '/admin',
    allowedRoles: [UserRole.ADMIN],
  },
  {
    prefix: '/dev',
    allowedRoles: [UserRole.ADMIN],
  },
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets and internal Next.js paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 2. Read session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  // 3. Handle /login page redirect if already logged in
  if (pathname === '/login') {
    if (user) {
      const homePath = getRoleHomePath(user.role);
      return NextResponse.redirect(new URL(homePath, request.url));
    }
    return NextResponse.next();
  }

  // 4. Public routes (Home, Unauthorized, Official Login Gate)
  if (pathname === '/' || pathname === '/unauthorized' || pathname === '/official-login') {
    return NextResponse.next();
  }

  // 5. Check if accessing a protected route
  const isProtectedPath =
    pathname.startsWith('/citizen') ||
    pathname.startsWith('/field') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin');

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // 6. Enforce Authentication
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7. Role-aware redirect for base /dashboard route
  if (pathname === '/dashboard') {
    const homePath = getRoleHomePath(user.role);
    return NextResponse.redirect(new URL(homePath, request.url));
  }

  // 8. Enforce Role Permissions for specific dashboards
  for (const rule of ROLE_ROUTE_PERMISSIONS) {
    if (pathname.startsWith(rule.prefix)) {
      if (!rule.allowedRoles.includes(user.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }
  }

  // Pass user info downstream in headers
  const response = NextResponse.next();
  response.headers.set('x-user-id', user.id);
  response.headers.set('x-user-role', user.role);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
