'use server'

import users from '@/data/users.json'
import { createSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { ActionState } from '@/types'

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

  // Verificação de credenciais contra o JSON (simulado)
  if (email === users.email && password === users.password) {
    // Criação da sessão segura
    await createSession(users.id)
    redirect('/dashboard')
  }

  // Mensagem genérica por segurança
  return {
    success: false,
    message: 'E-mail ou senha incorretos.',
  }
}
