'use server'

import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import fs from 'node:fs/promises'
import path from 'node:path'
import nodemailer from 'nodemailer'
import users from '@/data/users.json'
import accessProfiles from '@/data/access-profile.json'
import screens from '@/data/screens.json'
import { User, AccessProfile, Screen, Access, ActionState } from '@/types'
import { forbidden } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const USERS_FILE_PATH = path.join(process.cwd(), 'data/users.json')

export async function getUserRegistrationData() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return null
  }

  // Verificação de permissão
  const hasViewPermission = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'user_registration' && a.permission_key === 'view',
  )

  if (!hasViewPermission) {
    forbidden()
  }

  const currentUser = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
  if (!currentUser) return null

  // Filtra usuários pelo client_id do usuário logado e que não foram deletados
  const clientUsers = (users as User[]).filter(
    u => u.client_id === currentUser.client_id && !u.deleted_at,
  )

  // Mapeia os perfis de acesso para pegar os nomes
  const usersWithProfiles = clientUsers.map(user => {
    const profile = (accessProfiles as AccessProfile[]).find(p => p.id === user.access_profile_id)
    return {
      ...user,
      access_profile_name: profile?.name || 'Não definido',
    }
  })

  const screen = (screens as Screen[]).find(s => s.key === 'user_registration')

  const canCreate = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'user_registration' && a.permission_key === 'create',
  )

  const canUpdate = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'user_registration' && a.permission_key === 'update',
  )

  const canDelete = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'user_registration' && a.permission_key === 'delete',
  )

  return {
    users: usersWithProfiles,
    screen,
    canCreate,
    canUpdate,
    canDelete,
    lookups: {
      accessProfiles: accessProfiles as AccessProfile[],
    },
  }
}

export async function deleteUserAction(id: string | number): Promise<ActionState> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return { success: false, message: 'Sessão expirada.' }
  }

  const canDelete = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'user_registration' && a.permission_key === 'delete',
  )

  if (!canDelete) {
    return { success: false, message: 'Sem permissão para deletar.' }
  }

  try {
    const allUsers = [...(users as User[])]
    const index = allUsers.findIndex(u => u.id.toString() === id.toString())

    if (index === -1) {
      return { success: false, message: 'Usuário não encontrado.' }
    }

    allUsers[index] = {
      ...allUsers[index],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(allUsers, null, 2))
    revalidatePath('/')

    return { success: true, message: 'Usuário removido com sucesso.' }
  } catch (error) {
    console.error('Erro ao deletar usuário:', error)
    return { success: false, message: 'Erro ao processar a exclusão.' }
  }
}

export async function updateUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return { success: false, message: 'Sessão expirada.' }
  }

  const canUpdate = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'user_registration' && a.permission_key === 'update',
  )

  if (!canUpdate) {
    return { success: false, message: 'Sem permissão para atualizar.' }
  }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const accessProfileId = Number(formData.get('access_profile_id'))
  const isActive = formData.get('is_active') === 'on'

  if (!id || !name || !email || !accessProfileId) {
    return { success: false, message: 'Preencha todos os campos obrigatórios.' }
  }

  try {
    const allUsers = [...(users as User[])]
    const index = allUsers.findIndex(u => u.id.toString() === id.toString())

    if (index === -1) {
      return { success: false, message: 'Usuário não encontrado.' }
    }

    allUsers[index] = {
      ...allUsers[index],
      name,
      email,
      access_profile_id: accessProfileId,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }

    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(allUsers, null, 2))
    revalidatePath('/')

    return { success: true, message: 'Usuário atualizado com sucesso.' }
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return { success: false, message: 'Erro ao salvar as alterações.' }
  }
}

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return { success: false, message: 'Sessão expirada.' }
  }

  const canCreate = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'user_registration' && a.permission_key === 'create',
  )

  if (!canCreate) {
    return { success: false, message: 'Sem permissão para criar usuários.' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const accessProfileId = Number(formData.get('access_profile_id'))
  const isActive = formData.get('is_active') === 'on'

  if (!name || !email || !accessProfileId) {
    return { success: false, message: 'Preencha todos os campos obrigatórios.' }
  }

  try {
    const allUsers = [...(users as User[])]

    // Gerar ID sequencial
    const nextId = allUsers.length > 0 ? Math.max(...allUsers.map(u => Number(u.id))) + 1 : 1

    // Gerar senha aleatória (8 caracteres)
    const randomPassword = Math.random().toString(36).slice(-8)

    // Buscar o client_id do usuário logado para associar o novo usuário
    const currentUser = allUsers.find(u => u.id.toString() === payload.userId.toString())
    if (!currentUser) return { success: false, message: 'Usuário logado não encontrado.' }

    const newUser: User = {
      id: nextId,
      name,
      email,
      password: randomPassword, // Em produção, usar hash
      client_id: currentUser.client_id,
      is_active: isActive,
      access_profile_id: accessProfileId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }

    allUsers.push(newUser)

    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(allUsers, null, 2))

    // Configura o transporte do nodemailer (MailHog)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: Number(process.env.SMTP_PORT) || 1025,
      secure: false, // false para TLS
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    })

    // Dispara o e-mail
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@campanha360.com.br',
      to: email,
      subject: 'Bem-vindo ao Campanhas 360 - Dados de Acesso',
      text: `Olá ${name}, sua conta foi criada. Sua senha temporária é: ${randomPassword}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">Bem-vindo ao Campanhas 360</h2>
          <p style="color: #475569;">Olá <strong>${name}</strong>, sua conta de acesso foi criada com sucesso.</p>
          <p style="color: #475569;">Abaixo estão seus dados de acesso temporários:</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b;"><strong>E-mail:</strong> ${email}</p>
            <p style="margin: 10px 0 0 0; color: #64748b;"><strong>Senha Temporária:</strong> <span style="color: #2563eb; font-weight: bold;">${randomPassword}</span></p>
          </div>
          <p style="color: #64748b; font-size: 14px;">Recomendamos que você altere sua senha após o primeiro acesso.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2026 Campanhas 360 - Todos os direitos reservados.</p>
        </div>
      `,
    })

    revalidatePath('/')

    return { success: true, message: 'Usuário criado com sucesso. E-mail enviado com a senha.' }
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return { success: false, message: 'Erro ao criar o usuário.' }
  }
}
