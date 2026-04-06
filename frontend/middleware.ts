import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Halaman yang boleh diakses tanpa session
  if (path === '/login' || path === '/register' || path.startsWith('/_next') || path.includes('.')) {
    return NextResponse.next();
  }
  
  // Cek cookie Supabase session
  let isLoggedIn = false;
  const allCookies = request.cookies;
  for (const [name, value] of allCookies) {
    if (name.includes('sb-') && name.includes('-auth-token') && value) {
      isLoggedIn = true;
      break;
    }
  }
  
  // Jika belum login dan bukan halaman public, redirect ke login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
