import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ResetPasswordForm } from '@/components/forms/reset-password-form'

export default async function ResetPasswordPage() {
  const cookieStore = await cookies()
  const resetToken = cookieStore.get('reset-token')?.value
  const email = cookieStore.get('pending-email')?.value

  if (!resetToken || !email) {
    redirect('/forgot-password')
  }

  return <ResetPasswordForm email={email} />
}
