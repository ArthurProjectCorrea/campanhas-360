import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'
import { ResetPasswordForm } from '@/components/forms/reset-password-form'

async function getEmailFromToken(token: string) {
  try {
    const secretKey = process.env.SESSION_SECRET || 'campanhas-360-secret-key-super-secure-123'
    const encodedKey = new TextEncoder().encode(secretKey)
    const { payload } = await jwtVerify(token, encodedKey)
    return payload.email as string
  } catch {
    return null
  }
}

export default async function ResetPasswordPage() {
  const cookieStore = await cookies()
  const resetToken = cookieStore.get('reset-token')?.value

  if (!resetToken) {
    redirect('/forgot-password')
  }

  const email = await getEmailFromToken(resetToken)

  if (!email) {
    redirect('/forgot-password')
  }

  return <ResetPasswordForm email={email} />
}
