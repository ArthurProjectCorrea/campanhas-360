'use server'

import { getSession, hasPermission } from '@/lib/session'
import { Screen, RegionalPlanning } from '@/types'
import { forbidden } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export async function getRegionalPlanningData() {
  const session = await getSession()
  if (!session?.apiToken) return null

  // Verificação de permissão 'view' para a tela 'regional_planning'
  if (!(await hasPermission('regional_planning', 'view'))) {
    forbidden()
  }

  try {
    // Busca tela via API
    const screensRes = await fetch(`${API_URL}/screens`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })
    const screens = (await screensRes.json()) as Screen[]
    const screen = screens.find(s => s.key === 'regional_planning')

    // Temporariamente vazio até integrarmos com a API
    const items: RegionalPlanning[] = []

    return {
      items,
      screen,
      metrics: {
        totalGoal: 0,
        totalVotes: 0,
        achievementRate: 0,
        budget: {
          totalExpenses: 0,
          legalLimit: 0,
          expenseRate: 0,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching regional planning data:', error)
    return null
  }
}
