import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup', '/auth/callback', '/api/auth/callback'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasSession =
    request.cookies.has('sb-access-token') ||
    request.cookies.getAll().some((c) => c.name.includes('auth-token'));

  // Client-side Supabase stores session in localStorage; middleware is a soft gate.
  // Full protection happens in dashboard layout client check.
  if (!hasSession && !pathname.startsWith('/_next')) {
    // Allow through — client layout will redirect if no session
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
