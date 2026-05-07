'use server'

import fs from 'node:fs/promises'
import path from 'path'
import nodemailer from 'nodemailer'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'
import users from '@/data/users.json'
import { ActionState, User } from '@/types'

const OTPS_FILE_PATH = path.join(process.cwd(), 'data/otps.json')

interface OTP {
  email: string
  code: string
  expiresAt: string
}

export async function forgotPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = formData.get('email') as string

  if (!email) {
    return { success: false, message: 'Por favor, informe seu e-mail.' }
  }

  // Busca o usuário na base simulada
  const user = (users as User[]).find(u => u.email.toLowerCase() === email.toLowerCase())

  // Mensagem genérica para evitar enumeração de usuários
  const successMessage = 'Código enviado com sucesso!'

  // Armazena o e-mail em um cookie para o próximo passo (expira em 10 min)
  const cookieStore = await cookies()
  cookieStore.set('pending-email', email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 10 * 60 * 1000),
    sameSite: 'lax',
    path: '/',
  })

  if (!user) {
    // Simula um delay para dificultar ataques de timing
    await new Promise(resolve => setTimeout(resolve, 500))
    return { success: true, message: successMessage }
  }

  // Gera código OTP de 6 dígitos
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutos

  try {
    // Salva o OTP na base simulada
    let otps: OTP[] = []
    try {
      const data = await fs.readFile(OTPS_FILE_PATH, 'utf-8')
      otps = JSON.parse(data)
    } catch {
      // Se o arquivo não existir ou estiver corrompido, começa do zero
    }

    // Remove OTPs antigos do mesmo e-mail
    otps = otps.filter(o => o.email !== email)
    otps.push({ email, code: otpCode, expiresAt })

    await fs.writeFile(OTPS_FILE_PATH, JSON.stringify(otps, null, 2))

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
      subject: 'Recuperação de Senha - Código OTP',
      text: `Seu código de recuperação é: ${otpCode}. Ele expira em 5 minutos.`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">Recuperação de Senha</h2>
          <p style="color: #475569;">Você solicitou a recuperação de senha para sua conta no <strong>Campanhas 360</strong>.</p>
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${otpCode}</span>
          </div>
          <p style="color: #64748b; font-size: 14px;">Este código é válido por <strong>5 minutos</strong>. Se você não solicitou esta alteração, por favor ignore este e-mail.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2026 Campanhas 360 - Todos os direitos reservados.</p>
        </div>
      `,
    })

    // Redireciona via App Router
    redirect('/verify-otp')
  } catch (error) {
    if ((error as Error).message === 'NEXT_REDIRECT') throw error
    console.error('Erro ao processar recuperação de senha:', error)
    return { success: false, message: 'Erro ao processar sua solicitação.' }
  }
}

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
    const data = await fs.readFile(OTPS_FILE_PATH, 'utf-8')
    const otps: OTP[] = JSON.parse(data)

    const record = otps.find(o => o.email.toLowerCase() === email.toLowerCase())

    const genericError = 'Código inválido ou expirado.'

    if (!record) {
      return { success: false, message: genericError }
    }

    if (record.code !== otp) {
      return { success: false, message: genericError }
    }

    if (new Date() > new Date(record.expiresAt)) {
      return { success: false, message: genericError }
    }

    // Sucesso! Gera token de reset
    const secretKey = process.env.SESSION_SECRET || 'campanhas-360-secret-key-super-secure-123'
    const encodedKey = new TextEncoder().encode(secretKey)

    const resetToken = await new SignJWT({ email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m') // Token de reset válido por 15 min
      .sign(encodedKey)

    const cookieStore = await cookies()
    cookieStore.set('reset-token', resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(Date.now() + 15 * 60 * 1000),
      sameSite: 'lax',
      path: '/',
    })

    const updatedOtps = otps.filter(o => o.email.toLowerCase() !== email.toLowerCase())
    await fs.writeFile(OTPS_FILE_PATH, JSON.stringify(updatedOtps, null, 2))

    redirect('/reset-password')
  } catch (error) {
    if ((error as Error).message === 'NEXT_REDIRECT') throw error
    console.error('Erro na verificação de OTP:', error)
    return { success: false, message: 'Erro ao verificar o código.' }
  }
}

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

  // Validação de força da senha
  const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/
  if (!passwordRegex.test(password)) {
    return {
      success: false,
      message: 'A senha deve ter pelo menos 8 caracteres, um número e um caractere especial.',
    }
  }

  try {
    const cookieStore = await cookies()
    const resetToken = cookieStore.get('reset-token')?.value

    if (!resetToken) {
      return { success: false, message: 'Sessão de redefinição expirada ou inválida.' }
    }

    const secretKey = process.env.SESSION_SECRET || 'campanhas-360-secret-key-super-secure-123'
    const encodedKey = new TextEncoder().encode(secretKey)

    const { payload } = await jwtVerify(resetToken, encodedKey)
    const email = payload.email as string

    if (!email) {
      return { success: false, message: 'Token de redefinição inválido.' }
    }

    // Atualiza a senha no JSON
    const allUsers = [...(users as User[])]
    const userIndex = allUsers.findIndex(u => u.email.toLowerCase() === email.toLowerCase())

    if (userIndex === -1) {
      return { success: false, message: 'Usuário não encontrado.' }
    }

    allUsers[userIndex] = {
      ...allUsers[userIndex],
      password: password,
      updated_at: new Date().toISOString(),
    }

    const USERS_FILE_PATH = path.join(process.cwd(), 'data/users.json')
    await fs.writeFile(USERS_FILE_PATH, JSON.stringify(allUsers, null, 2))

    // Limpa os cookies de reset
    cookieStore.delete('reset-token')
    cookieStore.delete('pending-email')

    redirect('/sign-in')
  } catch (error) {
    if ((error as Error).message === 'NEXT_REDIRECT') throw error
    console.error('Erro ao redefinir senha:', error)
    return { success: false, message: 'Erro ao redefinir a senha. O token pode ter expirado.' }
  }
}
