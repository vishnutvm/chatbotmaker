import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/update-password',
  '/invite',
  '/auth/callback',
  '/privacy',
  '/terms',
  '/version',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Wizard entry — reserved segment; must not be treated as an assistant id.
  if (pathname === '/dashboard/assistants/new' || pathname === '/dashboard/assistants/new/') {
    return NextResponse.redirect(new URL('/dashboard/assistants/new/create', request.url));
  }

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)) || pathname === '/') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
