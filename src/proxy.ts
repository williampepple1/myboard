import { NextRequest, NextResponse } from 'next/server'

export default async function middleware(request: NextRequest) {
  if (request.method !== 'GET') return NextResponse.next()
  
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/auth') || pathname === '/login' || pathname.startsWith('/invite')) {
    return NextResponse.next()
  }

  try {
    const res = await fetch(new URL('/api/auth/get-session', request.url), {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } catch {
    // If fetch fails (e.g., during build), allow to proceed or redirect
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|invite|api/auth).*)'],
}
