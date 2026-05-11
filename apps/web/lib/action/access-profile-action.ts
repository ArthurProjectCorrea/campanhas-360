'use server'

import { getSession, hasPermission } from '@/lib/session'
import { ActionState, Screen, Permission } from '@/types'
import { forbidden } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

/**
 * Busca a lista de perfis de acesso do cliente autenticado.
 */
export async function getAccessProfileData() {
  const session = await getSession()
  if (!session?.apiToken) return null

  // Verificação de permissão 'view'
  if (!(await hasPermission('access_profile', 'view'))) {
    forbidden()
  }

  try {
    const [profilesRes, screensRes, permissionsRes] = await Promise.all([
      fetch(`${API_URL}/access-profiles`, {
        headers: { Authorization: `Bearer ${session.apiToken}` },
        next: { tags: ['access-profiles'], revalidate: 0 },
      }),
      fetch(`${API_URL}/screens`, { headers: { Authorization: `Bearer ${session.apiToken}` } }),
      fetch(`${API_URL}/permissions`, { headers: { Authorization: `Bearer ${session.apiToken}` } }),
    ])

    if (!profilesRes.ok) return null

    const profilesResponse = await profilesRes.json()
    const screens = (await screensRes.json()) as Screen[]
    const permissions = (await permissionsRes.json()) as Permission[]

    return {
      accessProfiles: profilesResponse.data,
      screen: profilesResponse.screen,
      canCreate: await hasPermission('access_profile', 'create'),
      canUpdate: await hasPermission('access_profile', 'update'),
      canDelete: await hasPermission('access_profile', 'delete'),
      lookups: {
        screens,
        permissions,
      },
    }
  } catch (error) {
    console.error('Error fetching access profile data:', error)
    return null
  }
}

/**
 * Busca um perfil específico por ID com seus respectivos acessos.
 */
export async function getAccessProfileById(id: string | number) {
  const session = await getSession()
  if (!session?.apiToken) return null

  try {
    const response = await fetch(`${API_URL}/access-profiles/${id}`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })

    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error('Error fetching profile by id:', error)
    return null
  }
}

/**
 * Cria ou atualiza um perfil de acesso (Upsert).
 */
export async function upsertAccessProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession()
  if (!session?.apiToken) return { success: false, message: 'Sessão expirada.' }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const isActive = formData.get('isActive') === 'on'
  const permissionsData = formData.get('permissions') as string // JSON string [{screenId, permissionId}]

  if (!name || !permissionsData) {
    return { success: false, message: 'Preencha todos os campos obrigatórios.' }
  }

  const isUpdate = !!id
  const permissionKey = isUpdate ? 'update' : 'create'

  if (!(await hasPermission('access_profile', permissionKey))) {
    return { success: false, message: 'Sem permissão para esta ação.' }
  }

  try {
    const payload = {
      name,
      isActive,
      accesses: JSON.parse(permissionsData),
    }

    const url = isUpdate ? `${API_URL}/access-profiles/${id}` : `${API_URL}/access-profiles`
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
      if (response.status === 403) return { success: false, message: 'Acesso negado pela API.' }
      return { success: false, message: 'Erro ao salvar o perfil na API.' }
    }

    revalidatePath('/')
    return {
      success: true,
      message: `Perfil de acesso ${isUpdate ? 'atualizado' : 'criado'} com sucesso.`,
    }
  } catch (error) {
    console.error('Error upserting access profile:', error)
    return { success: false, message: 'Erro de conexão com o servidor.' }
  }
}

/**
 * Realiza a exclusão lógica do perfil.
 */
export async function deleteAccessProfile(id: string | number): Promise<ActionState> {
  const session = await getSession()
  if (!session?.apiToken) return { success: false, message: 'Sessão expirada.' }

  if (!(await hasPermission('access_profile', 'delete'))) {
    return { success: false, message: 'Sem permissão para excluir perfis.' }
  }

  try {
    const response = await fetch(`${API_URL}/access-profiles/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })

    if (!response.ok) {
      return { success: false, message: 'Erro ao excluir o perfil.' }
    }

    revalidatePath('/')
    return { success: true, message: 'Perfil de acesso excluído com sucesso.' }
  } catch (error) {
    console.error('Error deleting profile:', error)
    return { success: false, message: 'Erro de conexão com o servidor.' }
  }
}
