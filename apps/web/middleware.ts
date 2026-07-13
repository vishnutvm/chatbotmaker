import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PREFIXES = ['/login', '/signup', '/auth/callback', '/privacy', '/terms'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) || pathname === '/') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
