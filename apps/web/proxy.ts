import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'
import { cookies } from 'next/headers'

// Rotas públicas que não requerem autenticação
const publicRoutes = [
  '/sign-in',
  '/sign-up',
  '/',
  '/forgot-password',
  '/verify-otp',
  '/reset-password',
]

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isPublicRoute = publicRoutes.includes(path)

  // Decifra a sessão do cookie
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)

  // Verifica cookies de fluxo para recuperação de senha
  if (path === '/verify-otp') {
    const pendingEmail = (await cookies()).get('pending-email')?.value
    if (!pendingEmail) {
      return NextResponse.redirect(new URL('/forgot-password', req.nextUrl))
    }
  }

  if (path === '/reset-password') {
    const resetToken = (await cookies()).get('reset-token')?.value
    if (!resetToken) {
      return NextResponse.redirect(new URL('/forgot-password', req.nextUrl))
    }
  }

  // Lógica de Multi-tenancy e Proteção
  const pathParts = path.split('/').filter(Boolean)

  // Verifica se o caminho atual segue o padrão /[domain]/dashboard/...
  const domainInUrl = pathParts[0]
  const isDashboardRequest = pathParts[1] === 'dashboard'

  // 1. Se estiver tentando acessar uma rota de dashboard/domínio
  if (isDashboardRequest) {
    // Se não estiver logado, vai para sign-in
    if (!session?.userId) {
      return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
    }

    // Se o domínio na URL for diferente do domínio da sessão, redireciona para o correto
    if (session.domain !== domainInUrl) {
      return NextResponse.redirect(new URL(`/${session.domain}/dashboard`, req.nextUrl))
    }
  }

  // 2. Se estiver logado e tentar acessar rotas públicas (como login), vai para o dashboard
  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL(`/${session.domain}/dashboard`, req.nextUrl))
  }

  // 3. Se tentar acessar /dashboard sem o domínio, redireciona para o domínio correto ou login
  if (path === '/dashboard') {
    if (session?.userId) {
      return NextResponse.redirect(new URL(`/${session.domain}/dashboard`, req.nextUrl))
    }
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  }

  return NextResponse.next()
}

// Configuração de matchers para o Middleware
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
