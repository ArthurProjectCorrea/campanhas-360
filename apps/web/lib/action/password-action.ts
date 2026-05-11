'use server'

import { cookies } from 'next/headers'
import { ActionState } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

/**
 * Solicitação de recuperação de senha.
 * Integração com endpoint POST /auth/forgot-password da API C#
 */
export async function forgotPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get('email') as string

  if (!email) {
    return { success: false, message: 'Por favor, informe seu e-mail.' }
  }

  try {
    await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
    })

    // Mesmo que a API retorne erro, prosseguimos para evitar enumeração
    // A API C# já retorna 200 OK com mensagem genérica em ambos os casos

    const cookieStore = await cookies()
    cookieStore.set('pending-email', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      sameSite: 'lax',
      path: '/',
    })

    return {
      success: true,
      message: 'Se o e-mail estiver cadastrado, você receberá um código em instantes.',
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error
    }
    console.error('Forgot password error:', error)
    return { success: false, message: 'Ocorreu um erro ao processar sua solicitação.' }
  }
}

/**
 * Verificação do código OTP.
 * Integração com endpoint POST /auth/verify-otp da API C#
 */
export async function verifyOtpAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get('email') as string
  const otp = formData.get('otp') as string

  if (!email || !otp) {
    return { success: false, message: 'Dados incompletos.' }
  }

  try {
    const response = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const data = await response.json()
      return { success: false, message: data.message || 'Código inválido ou expirado.' }
    }

    const { resetToken } = await response.json()

    const cookieStore = await cookies()
    cookieStore.set('reset-token', resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
      sameSite: 'lax',
      path: '/',
    })

    return { success: true, message: 'Código verificado com sucesso!' }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error
    }
    console.error('Verify OTP error:', error)
    return { success: false, message: 'Erro ao verificar o código.' }
  }
}

/**
 * Redefinição final de senha.
 * Integração com endpoint POST /auth/reset-password da API C#
 */
export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!password || !confirmPassword) {
    return { success: false, message: 'Preencha todos os campos.' }
  }

  if (password !== confirmPassword) {
    return { success: false, message: 'As senhas não coincidem.' }
  }

  try {
    const cookieStore = await cookies()
    const resetToken = cookieStore.get('reset-token')?.value

    if (!resetToken) {
      return { success: false, message: 'Sessão de redefinição expirada ou inválida.' }
    }

    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken, newPassword: password }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const data = await response.json()
      return { success: false, message: data.message || 'Erro ao redefinir a senha.' }
    }

    return { success: true, message: 'Senha redefinida com sucesso!' }
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error
    }
    console.error('Reset password error:', error)
    return { success: false, message: 'Erro ao redefinir a senha.' }
  }
}
