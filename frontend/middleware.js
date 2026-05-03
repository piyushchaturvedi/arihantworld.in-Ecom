import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl
  const token     = request.cookies.get('token')?.value
  const userRole  = request.cookies.get('userRole')?.value

  // ── Admin route protection ─────────────────────────────
  if (pathname.startsWith('/admin')) {
    // No token → redirect to login
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('from', pathname)
      return NextResponse.redirect(url)
    }
    // Has token but NOT admin → redirect to homepage
    if (userRole && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // ── Auth pages: redirect already-logged-in users ───────
  if (pathname.startsWith('/auth/') && token) {
    if (userRole === 'admin') return NextResponse.redirect(new URL('/admin', request.url))
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/auth/:path*'],
}
