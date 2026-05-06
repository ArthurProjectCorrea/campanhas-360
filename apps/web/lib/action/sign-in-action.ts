'use server'

import users from '@/data/users.json'
import clients from '@/data/clients.json'
import { createSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { ActionState, User, Client } from '@/types'

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

      // Criação da sessão segura com o domínio do cliente
      await createSession(user.id.toString(), client.domain)

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
