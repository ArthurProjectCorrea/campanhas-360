'use server'

import { createSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { ActionState, AccessProfile } from '@/types'

export async function signInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validação simples
  if (!email || !password) {
    return {
      success: false,
      message: 'Preencha todos os campos.',
    }
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    const response = await fetch(`${apiUrl}/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      // Importante para evitar caching de autenticação no server-side se necessário
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 401) {
        return { success: false, message: 'E-mail ou senha incorretos.' }
      }
      if (response.status === 403) {
        return { success: false, message: 'Acesso negado. Entre em contato com o suporte.' }
      }
      if (response.status === 429) {
        return { success: false, message: 'Muitas tentativas. Tente novamente em 1 minuto.' }
      }
      return { success: false, message: 'Sistema temporariamente indisponível.' }
    }

    const data = await response.json()

    // O retorno da API deve conter: { token, userId, userName, clientId, domain, accessProfileId, accessProfileName }
    // Precisamos adaptar para o formato que o Web espera
    const accessProfileData: AccessProfile = {
      id: data.accessProfileId,
      name: data.accessProfileName,
      is_active: true,
      client_id: data.clientId,
      // Por enquanto as permissões podem vir vazias ou serem carregadas depois
      accesses: [],
    }

    // Criação da sessão segura com o Token da API
    await createSession(
      data.userId.toString(),
      data.clientDomain,
      data.token,
      accessProfileData,
      data.permissions,
    )

    // Redireciona para o dashboard do domínio
    redirect(`/${data.clientDomain}/dashboard`)
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error
    }
    console.error('Sign-in error:', error)
    return {
      success: false,
      message: 'Ocorreu um erro ao tentar realizar o login.',
    }
  }
}
