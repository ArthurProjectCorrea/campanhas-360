'use server'

import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import fs from 'node:fs/promises'
import path from 'node:path'
import accessProfiles from '@/data/access-profile.json'
import users from '@/data/users.json'
import screens from '@/data/screens.json'
import permissions from '@/data/permissions.json'
import accesses from '@/data/accesses.json'
import { AccessProfile, Screen, Access, User, ActionState, Permission } from '@/types'
import { forbidden } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const ACCESS_PROFILES_FILE_PATH = path.join(process.cwd(), 'data/access-profile.json')
const ACCESSES_FILE_PATH = path.join(process.cwd(), 'data/accesses.json')

export async function getAccessProfileData() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return null
  }

  // Verificação de permissão 'view' para a tela 'access_profile'
  const hasViewPermission = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'access_profile' && a.permission_key === 'view',
  )

  if (!hasViewPermission) {
    forbidden()
  }

  // Permissões adicionais para a UI
  const canCreate = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'access_profile' && a.permission_key === 'create',
  )

  const canUpdate = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'access_profile' && a.permission_key === 'update',
  )

  const canDelete = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'access_profile' && a.permission_key === 'delete',
  )

  const currentUser = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
  if (!currentUser) return null

  const screen = (screens as Screen[]).find(s => s.key === 'access_profile')

  return {
    accessProfiles: (accessProfiles as AccessProfile[]).filter(
      p => p.client_id === currentUser.client_id && !p.deleted_at,
    ),
    screen,
    canCreate,
    canUpdate,
    canDelete,
    lookups: {
      screens: screens as Screen[],
      permissions: permissions as Permission[],
    },
  }
}

export async function getAccessProfileById(id: string | number) {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) return null

  const profile = (accessProfiles as AccessProfile[]).find(
    p => p.id.toString() === id.toString() && !p.deleted_at,
  )

  if (!profile) return null

  // Busca as permissões vinculadas a este perfil
  const profileAccesses = (accesses as Access[]).filter(
    a => a.access_profile_id.toString() === id.toString(),
  )

  return {
    ...profile,
    accesses: profileAccesses,
  }
}

export async function updateAccessProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const isActive = formData.get('is_active') === 'on'
  const permissionsData = formData.get('permissions') as string // JSON string

  if (!id || !name) {
    return { success: false, message: 'Preencha todos os campos obrigatórios.' }
  }

  try {
    const allProfiles = [...(accessProfiles as AccessProfile[])]
    const index = allProfiles.findIndex(p => p.id.toString() === id.toString())

    if (index === -1) {
      return { success: false, message: 'Perfil não encontrado.' }
    }

    allProfiles[index] = {
      ...allProfiles[index],
      name,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }

    await fs.writeFile(ACCESS_PROFILES_FILE_PATH, JSON.stringify(allProfiles, null, 2))

    // Atualizar permissões (accesses.json)
    const newAccessesList = JSON.parse(permissionsData) as {
      screen_id: number
      permission_id: number
    }[]
    let allAccesses = [...(accesses as Access[])]

    // Remove as antigas do perfil
    allAccesses = allAccesses.filter(a => a.access_profile_id.toString() !== id.toString())

    // Adiciona as novas
    newAccessesList.forEach(acc => {
      allAccesses.push({
        access_profile_id: Number(id),
        screen_id: acc.screen_id,
        permission_id: acc.permission_id,
      })
    })

    await fs.writeFile(ACCESSES_FILE_PATH, JSON.stringify(allAccesses, null, 2))
    revalidatePath('/')

    return { success: true, message: 'Perfil de acesso atualizado com sucesso.' }
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { success: false, message: 'Erro ao salvar as alterações.' }
  }
}

export async function createAccessProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return { success: false, message: 'Sessão expirada.' }
  }

  const name = formData.get('name') as string
  const isActive = formData.get('is_active') === 'on'
  const permissionsData = formData.get('permissions') as string

  if (!name) {
    return { success: false, message: 'O nome do perfil é obrigatório.' }
  }

  try {
    const currentUser = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
    if (!currentUser) return { success: false, message: 'Usuário não encontrado.' }

    const allProfiles = [...(accessProfiles as AccessProfile[])]
    const nextId = allProfiles.length > 0 ? Math.max(...allProfiles.map(p => Number(p.id))) + 1 : 1

    const newProfile: AccessProfile = {
      id: nextId,
      name,
      is_active: isActive,
      client_id: Number(currentUser.client_id),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }

    allProfiles.push(newProfile)
    await fs.writeFile(ACCESS_PROFILES_FILE_PATH, JSON.stringify(allProfiles, null, 2))

    // Salvar permissões
    const newAccessesList = JSON.parse(permissionsData) as {
      screen_id: number
      permission_id: number
    }[]
    const allAccesses = [...(accesses as Access[])]

    newAccessesList.forEach(acc => {
      allAccesses.push({
        access_profile_id: nextId,
        screen_id: acc.screen_id,
        permission_id: acc.permission_id,
      })
    })

    await fs.writeFile(ACCESSES_FILE_PATH, JSON.stringify(allAccesses, null, 2))
    revalidatePath('/')

    return { success: true, message: 'Perfil de acesso criado com sucesso.' }
  } catch (error) {
    console.error('Erro ao criar perfil:', error)
    return { success: false, message: 'Erro ao criar o perfil.' }
  }
}

export async function deleteAccessProfile(id: string | number): Promise<ActionState> {
  try {
    const allProfiles = [...(accessProfiles as AccessProfile[])]
    const index = allProfiles.findIndex(p => p.id.toString() === id.toString())

    if (index === -1) {
      return { success: false, message: 'Perfil não encontrado.' }
    }

    allProfiles[index] = {
      ...allProfiles[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await fs.writeFile(ACCESS_PROFILES_FILE_PATH, JSON.stringify(allProfiles, null, 2))
    revalidatePath('/')

    return { success: true, message: 'Perfil de acesso excluído com sucesso.' }
  } catch (error) {
    console.error('Erro ao excluir perfil:', error)
    return { success: false, message: 'Erro ao processar a exclusão.' }
  }
}
