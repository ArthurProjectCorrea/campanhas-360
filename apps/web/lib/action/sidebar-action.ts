'use server'

import { getSession } from '@/lib/session'
import { getNavMain } from '@/lib/sidebar'
import { SidebarData, Screen } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function getSidebarData(): Promise<SidebarData | null> {
  const session = await getSession()
  if (!session?.apiToken) return null

  try {
    // 1. Busca dados ricos do usuário no PostgreSQL via novo endpoint
    const userRes = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
      cache: 'no-store',
    })

    if (!userRes.ok) return null
    const userData = (await userRes.json()) as {
      name: string
      email: string
      accessProfileName: string
      ballotName?: string
      positionName?: string
      avatarUrl?: string
      candidateNumber?: number
      electionYear?: number
      partyName?: string
      partySlug?: string
      municipalityName?: string
      stateAcronym?: string
    }

    // 2. Extrai as telas permitidas diretamente da sessão
    const viewPermissions = session.permissions?.filter(p => p.key === 'view') || []

    const permittedScreens: Screen[] = viewPermissions.map((p, index) => ({
      id: index,
      key: p.screen,
      title: p.title || p.screen,
      icon: p.icon || 'help-circle',
    }))

    const navMain = getNavMain(permittedScreens, session.domain)

    // 3. Retorna os dados agregados
    return {
      ballotName: userData.ballotName || 'Candidato',
      positionName: userData.positionName || userData.accessProfileName || 'Cargo',
      avatarUrl: userData.avatarUrl || '',
      candidateNumber: userData.candidateNumber || 0,
      electionYear: userData.electionYear || 0,
      partyName: userData.partyName || 'Partido',
      partySlug: userData.partySlug || 'PTD',
      municipalityName: userData.municipalityName || 'Cidade',
      stateAcronym: userData.stateAcronym || 'UF',
      hasActiveCampaign: !!userData.electionYear,
      userName: userData.name,
      userEmail: userData.email,
      navMain,
    }
  } catch (error) {
    console.error('Error fetching sidebar data:', error)
    return null
  }
}
