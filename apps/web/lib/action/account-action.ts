'use server'

import { cookies } from 'next/headers'
import { decrypt, createSession } from '@/lib/session'
import fs from 'node:fs/promises'
import path from 'node:path'
import users from '@/data/users.json'
import accessProfiles from '@/data/access-profile.json'
import { User, ActionState, AccessProfile } from '@/types'
import { revalidatePath } from 'next/cache'

const USERS_FILE_PATH = path.join(process.cwd(), 'data/users.json')

export async function getAccountData() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return null
  }

  const user = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
  if (!user) return null

  const profile = (accessProfiles as AccessProfile[]).find(
    p =>
      p.id ===
      (typeof user.access_profile_id === 'number'
        ? user.access_profile_id
        : user.access_profile_id.id),
  )

  return {
    user: {
      name: user.name,
      email: user.email,
    },
    profileName: profile?.name || 'N/A',
  }
}

export async function updateAccountAction(
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
  const email = formData.get('email') as string

  if (!name || !email) {
    return { success: false, message: 'Preencha todos os campos obrigatórios.' }
  }

  try {
    const allUsers = [...(users as User[])]
    const index = allUsers.findIndex(u => u.id.toString() === payload.userId.toString())

    if (index === -1) {
      return { success: false, message: 'Usuário não encontrado.' }
    }

    allUsers[index] = {
      ...allUsers[index],
      name,
      email,
      updated_at: new Date().toISOString(),
    }

    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(allUsers, null, 2))

    // Renova a sessão para garantir que os dados estejam atualizados
    await createSession(payload.userId, payload.domain, payload.apiToken, payload.accessProfile)

    revalidatePath('/')

    return { success: true, message: 'Dados atualizados com sucesso.' }
  } catch (error) {
    console.error('Erro ao salvar conta:', error)
    return { success: false, message: 'Erro ao salvar as alterações.' }
  }
}
