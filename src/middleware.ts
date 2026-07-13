import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export default async function middleware(request: NextRequest) {
  if (request.method !== 'GET') return NextResponse.next()
  
  const res = await auth.middleware({ loginUrl: '/login' })(request)
  
  if (process.env.NODE_ENV === 'development' && res) {
    const setCookies = res.headers.getSetCookie();
    if (setCookies && setCookies.length > 0) {
      res.headers.delete('set-cookie');
      for (const cookie of setCookies) {
        res.headers.append('set-cookie', cookie.replace(/Secure;?\s?/gi, ''));
      }
    }
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|invite|api/auth).*)'],
}
