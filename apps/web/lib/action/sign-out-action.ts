'use server'

import { deleteSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export async function signOutAction() {
  await deleteSession()
  redirect('/sign-in')
}
