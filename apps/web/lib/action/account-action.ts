'use server'
import { getSession } from '@/lib/session'
import { ActionState } from '@/types'
import { revalidatePath } from 'next/cache'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function getProfile() {
  const session = await getSession()
  if (!session?.apiToken) return null

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
      cache: 'no-store',
    })

    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession()
  if (!session?.apiToken) {
    return { success: false, message: 'Sessão expirada. Faça login novamente.' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string

  if (!name || !email) {
    return { success: false, message: 'Nome e e-mail são obrigatórios.' }
  }

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.apiToken}`,
      },
      body: JSON.stringify({
        name,
        email,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        message: errorData.message || 'Erro ao atualizar perfil.',
      }
    }

    revalidatePath('/')
    return { success: true, message: 'Perfil atualizado com sucesso!' }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { success: false, message: 'Ocorreu um erro ao tentar atualizar o perfil.' }
  }
}
