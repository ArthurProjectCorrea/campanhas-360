'use server'

import { getSession, hasPermission } from '@/lib/session'
import { AccessProfile, ActionState, Screen } from '@/types'
import { forbidden } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

/**
 * Busca dados para a tela de registro de usuários via API.
 */
export async function getUserRegistrationData() {
  const session = await getSession()
  if (!session?.apiToken) return null

  // Verificação de permissão
  if (!(await hasPermission('user_registration', 'view'))) {
    forbidden()
  }

  try {
    const [usersRes, profilesRes, screensRes] = await Promise.all([
      fetch(`${API_URL}/users`, { headers: { Authorization: `Bearer ${session.apiToken}` } }),
      fetch(`${API_URL}/access-profiles`, {
        headers: { Authorization: `Bearer ${session.apiToken}` },
      }),
      fetch(`${API_URL}/screens`, { headers: { Authorization: `Bearer ${session.apiToken}` } }),
    ])

    if (!usersRes.ok || !profilesRes.ok) return null

    const usersData = await usersRes.json()
    const profiles = await profilesRes.json()
    const screens = await screensRes.json()
    const screen = screens.find((s: Screen) => s.key === 'user_registration')

    return {
      users: usersData,
      screen,
      canCreate: await hasPermission('user_registration', 'create'),
      canUpdate: await hasPermission('user_registration', 'update'),
      canDelete: await hasPermission('user_registration', 'delete'),
      lookups: {
        accessProfiles: profiles as AccessProfile[],
      },
    }
  } catch (error) {
    console.error('Error fetching user registration data:', error)
    return null
  }
}

/**
 * Deleta um usuário via API.
 */
export async function deleteUserAction(id: string | number): Promise<ActionState> {
  const session = await getSession()
  if (!session?.apiToken) return { success: false, message: 'Sessão expirada.' }

  if (!(await hasPermission('user_registration', 'delete'))) {
    return { success: false, message: 'Sem permissão para deletar.' }
  }

  try {
    const response = await fetch(`${API_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })

    if (!response.ok) return { success: false, message: 'Erro ao deletar usuário na API.' }

    revalidatePath('/')
    return { success: true, message: 'Usuário removido com sucesso.' }
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return { success: false, message: 'Erro de conexão com o servidor.' }
  }
}

/**
 * Cria ou atualiza um usuário via API (Upsert).
 */
export async function upsertUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession()
  if (!session?.apiToken) return { success: false, message: 'Sessão expirada.' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const accessProfileId = formData.get('access_profile_id') as string
  const isActive = formData.get('isActive') === 'on'

  if (!name || !email || !accessProfileId) {
    return { success: false, message: 'Preencha todos os campos obrigatórios.' }
  }

  const isUpdate = !!id
  const permissionKey = isUpdate ? 'update' : 'create'

  if (!(await hasPermission('user_registration', permissionKey))) {
    return { success: false, message: 'Sem permissão para esta ação.' }
  }

  try {
    const payload = {
      name,
      email,
      accessProfileId,
      isActive,
    }

    const url = isUpdate ? `${API_URL}/users/${id}` : `${API_URL}/users`
    const method = isUpdate ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.apiToken}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { success: false, message: errorData.message || 'Erro ao salvar usuário na API.' }
    }

    revalidatePath('/')
    return {
      success: true,
      message: `Usuário ${isUpdate ? 'atualizado' : 'criado'} com sucesso.`,
    }
  } catch (error) {
    console.error('Error upserting user:', error)
    return { success: false, message: 'Erro de conexão com o servidor.' }
  }
}
