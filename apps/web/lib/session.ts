import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { SessionPayload, AccessProfile } from '@/types'

const secretKey = process.env.SESSION_SECRET || 'campanhas-360-secret-key-super-secure-123'
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(
  userId: string,
  domain: string,
  apiToken: string,
  accessProfile?: AccessProfile,
  permissions?: { screen: string; key: string; icon?: string; title?: string }[],
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const session = await encrypt({ userId, domain, apiToken, accessProfile, permissions, expiresAt })
  const cookieStore = await cookies()

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function updateSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!session || !payload) {
    return null
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expires,
    sameSite: 'lax',
    path: '/',
  })
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  return await decrypt(session)
}

/**
 * Valida o token da sessão diretamente com a API.
 * Útil para garantir que a sessão no Redis ainda é válida e obter dados atualizados.
 */
export async function verifySessionWithApi() {
  const session = await getSession()
  if (!session?.apiToken) return null

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    const response = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${session.apiToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Sessão expirou ou usuário foi inativado
        await deleteSession()
      }
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao verificar sessão com a API:', error)
    return null
  }
}

/**
 * Solicita a renovação do token de sessão (Token Rotation) para a API.
 */
export async function refreshSessionWithApi() {
  const session = await getSession()
  if (!session?.apiToken) return null

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.apiToken}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        await deleteSession()
      }
      return null
    }

    const data = await response.json()

    // Atualiza a sessão com o novo token e dados
    await createSession(
      data.userId,
      data.clientDomain,
      data.token,
      {
        id: data.accessProfileId,
        name: data.accessProfileName,
        isActive: true,
        clientId: data.clientId,
      },
      data.permissions,
    )

    return data
  } catch (error) {
    console.error('Erro ao renovar sessão com a API:', error)
    return null
  }
}

/**
 * Verifica se o usuário autenticado possui uma permissão específica para uma tela.
 */
export async function hasPermission(screen: string, key: string): Promise<boolean> {
  const session = await getSession()
  if (!session?.permissions) return false

  // Permissões consideradas globais ou de acesso básico podem ser tratadas aqui se necessário
  // Por enquanto, verificamos a matriz exata vinda da API
  return session.permissions.some(p => p.screen === screen && p.key === key)
}
