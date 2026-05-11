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
  const cookieValue = req.cookies.get('session')?.value
  const session = await decrypt(cookieValue)

  // 1. Validação de Fluxo de Recuperação de Senha
  if (path === '/verify-otp' && !req.cookies.get('pending-email')?.value) {
    return NextResponse.redirect(new URL('/forgot-password', req.nextUrl))
  }

  if (path === '/reset-password' && !req.cookies.get('reset-token')?.value) {
    return NextResponse.redirect(new URL('/forgot-password', req.nextUrl))
  }

  // Lógica de Multi-tenancy e Proteção
  const pathParts = path.split('/').filter(Boolean)
  const domainInUrl = pathParts[0]
  const isDashboardRequest = pathParts[1] === 'dashboard'

  // 2. Validação Ativa com a API para rotas de dashboard
  if (isDashboardRequest && session?.userId) {
    // Validação de Domínio (Multi-tenancy)
    if (session.domain !== domainInUrl) {
      return NextResponse.redirect(new URL(`/${session.domain}/dashboard`, req.nextUrl))
    }

    try {
      // Verifica integridade da sessão no Redis e status da conta
      // Fazemos isso em rotas de navegação para garantir segurança sem sobrecarregar demais
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      const apiResponse = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${session.apiToken}` },
        cache: 'no-store',
      })

      if (!apiResponse.ok) {
        // Logout Forçado: Usuário inativado, deletado ou sessão expirada no Redis
        const response = NextResponse.redirect(
          new URL('/sign-in?error=session_invalid', req.nextUrl),
        )
        response.cookies.delete('session')
        return response
      }

      // Opcional: Aqui poderíamos comparar o token se houvesse rotação automática via middleware
      // Mas a rotação geralmente é disparada por uma Server Action específica ou endpoint de refresh.
    } catch (error) {
      console.error('Erro na validação ativa do Proxy:', error)
      // Em caso de erro de rede na API, permitimos o acesso temporário para não quebrar a UX
      // A menos que a segurança exija bloqueio total.
    }
  }

  // 3. Se não estiver logado e tentar acessar dashboard, vai para sign-in
  if (isDashboardRequest && !session?.userId) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  }

  // 4. Se estiver logado e tentar acessar rotas públicas, vai para o dashboard
  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL(`/${session.domain}/dashboard`, req.nextUrl))
  }

  // 5. Redirecionamento de /dashboard sem domínio
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
