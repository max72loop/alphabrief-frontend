import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Rafraîchit la session — ne pas supprimer cet appel
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Redirige vers /login si non authentifié sur routes protégées
  const protectedPaths = ['/dashboard', '/ticker']
  const isProtected = protectedPaths.some(p => path.startsWith(p))
  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirige vers /dashboard si déjà connecté sur /login
  if (user && path === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/ticker/:path*',
    '/login',
  ],
}
