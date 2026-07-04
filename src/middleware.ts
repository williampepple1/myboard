import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export default async function middleware(request: NextRequest) {
  if (request.method !== 'GET') return NextResponse.next()
  return auth.middleware({ loginUrl: '/login' })(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|login|invite|api/auth).*)'],
}
