'use server'

import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import users from '@/data/users.json'
import clients from '@/data/clients.json'
import candidates from '@/data/candidates.json'
import positions from '@/data/positions.json'
import parties from '@/data/party.json'
import municipalities from '@/data/municipalities.json'
import states from '@/data/states.json'
import screens from '@/data/screens.json'
import { getNavMain } from '@/lib/sidebar'
import { User, Client, Candidate, Position, SidebarData, Screen } from '@/types'

export async function getSidebarData(): Promise<SidebarData | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return null
  }

  const user = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
  if (!user) return null

  const client = (clients as Client[]).find(c => c.id.toString() === user.client_id.toString())
  if (!client) return null

  const candidate = (candidates as Candidate[]).find(
    c => c.id.toString() === client.candidate_id.toString(),
  )
  const position = (positions as Position[]).find(
    p => p.id.toString() === client.position_id.toString(),
  )
  const party = (parties as { id: number | string; name: string; slug: string }[]).find(
    p => p.id.toString() === client.party_id.toString(),
  )
  const municipality = (
    municipalities as { id: number | string; name: string; tse_name: string }[]
  ).find(m => m.id.toString() === client.municipality_id.toString())

  // O estado é identificado pelos dois primeiros dígitos do ID do município (código IBGE)
  const stateId = municipality?.id.toString().substring(0, 2)
  const state = (states as { id: number | string; sigla: string }[]).find(
    s => s.id.toString() === stateId,
  )
  const municipalityDisplay = municipality
    ? `${municipality.name}${state ? `-${state.sigla}` : ''}`
    : ''

  // 1. Filtra as telas permitidas (view) baseadas no perfil de acesso da sessão
  const permittedScreens = (screens as Screen[]).filter(
    screen =>
      payload.accessProfile?.accesses?.some(
        a => a.screen_key === screen.key && a.permission_key === 'view',
      ) ?? false,
  )

  // 2. Gera o NavMain passando as telas permitidas para o template em sidebar.ts
  const navMain = getNavMain(permittedScreens, client.domain)

  return {
    ballot_name: candidate?.ballot_name || 'Candidato',
    position_name: position?.name || 'Cargo',
    avatar_url: candidate?.avatar_url || '',
    candidate_number: client.candidate_number,
    election_year: client.election_year,
    party_name: party?.name || '',
    party_slug: party?.slug || '',
    municipality_name: municipalityDisplay,
    user_name: user.name,
    user_email: user.email,
    navMain,
  }
}
