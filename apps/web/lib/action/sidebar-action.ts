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
    const userData = (await userRes.json()) as { name: string; email: string; role: string }

    // 2. Extrai as telas permitidas diretamente da sessão (que agora contém ícones e títulos)
    // Filtramos apenas por permissão de 'view'
    const viewPermissions = session.permissions?.filter(p => p.key === 'view') || []

    // Mapeia para o formato de Screen esperado pelo getNavMain
    const permittedScreens: Screen[] = viewPermissions.map((p, index) => ({
      id: index,
      key: p.screen,
      title: p.title || p.screen,
      icon: p.icon || 'help-circle',
      sidebar: p.title,
    }))

    const navMain = getNavMain(permittedScreens, session.domain)

    // 3. Retorna os dados agregados (Placeholders para Campanha/Candidato por enquanto)
    return {
      ballot_name: 'Candidato Exemplo',
      position_name: userData.role || 'Cargo',
      avatar_url: '',
      candidate_number: 99,
      election_year: 2026,
      party_name: 'Partido Exemplo',
      party_slug: 'PEX',
      municipality_name: 'Cidade Exemplo',
      user_name: userData.name,
      user_email: userData.email,
      navMain,
    }
  } catch (error) {
    console.error('Error fetching sidebar data:', error)
    return null
  }
}
