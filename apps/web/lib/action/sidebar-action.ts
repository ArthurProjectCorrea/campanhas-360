'use server'

import { getSession } from '@/lib/session'
import users from '@/data/users.json'
import clients from '@/data/clients.json'
import candidates from '@/data/candidates.json'
import positions from '@/data/positions.json'
import parties from '@/data/party.json'
import municipalities from '@/data/municipalities.json'
import states from '@/data/states.json'
import campaigns from '@/data/campaigns.json'
import { getNavMain } from '@/lib/sidebar'
import { User, Client, Candidate, Position, SidebarData, Screen, Campaign } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function getSidebarData(): Promise<SidebarData | null> {
  const session = await getSession()
  if (!session?.apiToken) return null

  // Busca dados do usuário (ainda de JSON por enquanto, mas logo migrará)
  const user = (users as User[]).find(u => u.id.toString() === session.userId.toString())
  if (!user || !user.client_id) return null

  const clientId = user.client_id.toString()

  const client = (clients as Client[]).find(c => c.id.toString() === clientId)
  if (!client) return null

  const activeCampaign = (campaigns as Campaign[]).find(
    c => c.client_id.toString() === clientId && c.is_active && !c.deleted_at,
  )

  if (!activeCampaign) return null

  const candidate = (candidates as Candidate[]).find(
    c => c.id.toString() === activeCampaign.candidate_id.toString(),
  )
  const position = (positions as Position[]).find(
    p => p.id.toString() === activeCampaign.position_id.toString(),
  )
  const party = (parties as { id: number | string; name: string; acronym: string }[]).find(
    p => p.id.toString() === activeCampaign.party_id.toString(),
  )
  const municipality = (
    municipalities as { id: number | string; name: string; tse_id: number }[]
  ).find(m => m.id.toString() === activeCampaign.municipality_id.toString())

  const stateId = municipality?.id.toString().substring(0, 2)
  const state = (states as { id: number | string; acronym: string }[]).find(
    s => s.id.toString() === stateId,
  )
  const municipalityDisplay = municipality
    ? `${municipality.name}${state ? `-${state.acronym}` : ''}`
    : ''

  try {
    // Busca a lista oficial de telas da API para montar o menu
    const screensRes = await fetch(`${API_URL}/screens`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })
    const allScreens = (await screensRes.json()) as Screen[]

    // Filtra as telas baseadas nas permissões do payload da sessão
    const permittedScreens = allScreens.filter(screen =>
      session.permissions?.some(p => p.screen === screen.key && p.key === 'view'),
    )

    const navMain = getNavMain(permittedScreens, client.domain)

    return {
      ballot_name: candidate?.ballot_name || 'Candidato',
      position_name: position?.name || 'Cargo',
      avatar_url: candidate?.avatar_url || '',
      candidate_number: activeCampaign.candidate_number,
      election_year: activeCampaign.election_year,
      party_name: party?.name || '',
      party_slug: party?.acronym || '',
      municipality_name: municipalityDisplay,
      user_name: user.name,
      user_email: user.email,
      navMain,
    }
  } catch (error) {
    console.error('Error fetching sidebar data:', error)
    return null
  }
}
