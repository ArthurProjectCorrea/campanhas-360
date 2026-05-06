'use server'

import users from '@/data/users.json'
import clients from '@/data/clients.json'
import accessProfiles from '@/data/access-profile.json'
import accesses from '@/data/accesses.json'
import permissions from '@/data/permissions.json'
import screens from '@/data/screens.json'
import { createSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { ActionState, User, Client, AccessProfile, Access, Permission, Screen } from '@/types'

export async function signInAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Simulação de atraso de rede
  await new Promise(resolve => setTimeout(resolve, 800))

  // Validação simples
  if (!email || !password) {
    return {
      success: false,
      message: 'Preencha todos os campos.',
    }
  }

  // Verificação de credenciais
  const user = (users as User[]).find(u => u.email === email && u.password === password)

  if (user) {
    // Busca o cliente do usuário
    const client = (clients as Client[]).find(c => c.id === user.client_id)

    if (client) {
      // Validação de conta ativa ou excluída (Usuário e Cliente)
      if (!user.is_active || user.deleted_at || !client.is_active || client.deleted_at) {
        return {
          success: false,
          message: 'Acesso negado. Entre em contato com o suporte.',
        }
      }

      // 1. Busca o Perfil de Acesso do usuário
      const accessProfileId =
        typeof user.access_profile_id === 'number'
          ? user.access_profile_id
          : (user.access_profile_id as AccessProfile).id

      const profile = (accessProfiles as AccessProfile[]).find(p => p.id === accessProfileId)

      let accessProfileData: AccessProfile | undefined = undefined

      if (profile) {
        // 2. Busca as permissões vinculadas ao perfil
        const profileAccesses = (accesses as Access[]).filter(
          a => a.access_profile_id === profile.id,
        )

        // 3. Enriquece os acessos com as chaves de permissão e tela
        const joinedAccesses = profileAccesses.map(a => {
          const p = (permissions as Permission[]).find(perm => perm.id === a.permission_id)
          const s = (screens as Screen[]).find(scr => scr.id === a.screen_id)
          return {
            ...a,
            permission_key: p?.key,
            screen_key: s?.key,
          }
        })

        accessProfileData = {
          ...profile,
          accesses: joinedAccesses,
        }
      }

      // Criação da sessão segura com o domínio do cliente e perfil de acesso
      await createSession(user.id.toString(), client.domain, accessProfileData)

      // Redireciona para o dashboard do domínio
      redirect(`/${client.domain}/dashboard`)
    }
  }

  // Mensagem genérica por segurança
  return {
    success: false,
    message: 'E-mail ou senha incorretos.',
  }
}
