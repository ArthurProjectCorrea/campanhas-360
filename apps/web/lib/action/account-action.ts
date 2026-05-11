'use server'

import { getSession } from '@/lib/session'
import { ActionState } from '@/types'
import { revalidatePath } from 'next/cache'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

/**
 * Busca dados da conta do usuário logado via API.
 */
export async function getAccountData() {
  const session = await getSession()
  if (!session?.apiToken) return null

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })

    if (!response.ok) return null
    const data = await response.json()

    return {
      user: {
        name: data.name,
        email: data.email,
      },
      profileName: data.accessProfileName || 'N/A',
    }
  } catch (error) {
    console.error('Error fetching account data:', error)
    return null
  }
}

/**
 * Atualiza os dados da conta do usuário via API.
 */
export async function updateAccountAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession()
  if (!session?.apiToken) {
    return { success: false, message: 'Sessão expirada.' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string

  if (!name || !email) {
    return { success: false, message: 'Preencha todos os campos obrigatórios.' }
  }

  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.apiToken}`,
      },
      body: JSON.stringify({ name, email }),
    })

    if (!response.ok) {
      return { success: false, message: 'Erro ao atualizar os dados na API.' }
    }

    revalidatePath('/')
    return { success: true, message: 'Dados atualizados com sucesso.' }
  } catch (error) {
    console.error('Erro ao salvar conta:', error)
    return { success: false, message: 'Erro de conexão com o servidor.' }
  }
}
