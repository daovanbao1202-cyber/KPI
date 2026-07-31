import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';

/**
 * Server-side route protection.
 *
 * Next.js 16 renamed the `middleware` convention to `proxy`; the behaviour is
 * unchanged. This performs an optimistic cookie check only — no database
 * lookups — as the Next.js authentication guide recommends. Route Handlers and
 * pages still verify authorization themselves.
 */

/** Reachable without a session. */
const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/password',
  '/api/auth/session',
  // Guarded separately by CRON_SECRET so Vercel Cron can reach it.
  '/api/notifications/check-kpi',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname.startsWith('/api/')) {
    if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.next();
    }
    if (!session) {
      return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Dashboard pages.
  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*'],
};
