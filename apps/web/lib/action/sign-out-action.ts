'use server'

import { deleteSession, getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function signOutAction() {
  const session = await getSession()

  if (session?.apiToken) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
      await fetch(`${apiUrl}/auth/sign-out`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.apiToken}`,
        },
      })
    } catch (error) {
      console.error('Sign-out API error:', error)
    }
  }

  await deleteSession()
  redirect('/sign-in')
}
