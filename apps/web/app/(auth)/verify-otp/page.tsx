import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { VerifyOtpForm } from '@/components/forms/verify-otp-form'
import { Spinner } from '@/components/ui/spinner'

export default async function VerifyOtpPage() {
  const cookieStore = await cookies()
  const email = cookieStore.get('pending-email')?.value

  if (!email) {
    redirect('/forgot-password')
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <VerifyOtpForm email={email} />
    </Suspense>
  )
}
