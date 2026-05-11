'use server'

import { getSession, hasPermission } from '@/lib/session'
import users from '@/data/users.json'
import regionalPlanningData from '@/data/regional-planning.json'
import financialData from '@/data/financial.json'
import campaignsData from '@/data/campaigns.json'
import { Screen, User, RegionalPlanning, Financial, Campaign } from '@/types'
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
    const user = (users as User[]).find(u => u.id.toString() === session.userId.toString())
    if (!user) return null

    const activeCampaign = (campaignsData as Campaign[]).find(
      c => c.client_id === user.client_id && !c.deleted_at && c.is_active,
    )

    if (!activeCampaign) return null

    // Busca tela via API
    const screensRes = await fetch(`${API_URL}/screens`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
    })
    const screens = (await screensRes.json()) as Screen[]
    const screen = screens.find(s => s.key === 'regional_planning')

    const items = (regionalPlanningData as RegionalPlanning[]).filter(
      p => p.campaign_id === activeCampaign.id && !p.deleted_at && p.is_active,
    )

    const totalGoal = items.reduce((acc, curr) => acc + curr.goal, 0)
    const totalVotes = items.reduce((acc, curr) => acc + curr.votes, 0)

    const achievementRate = totalGoal > 0 ? (totalVotes / totalGoal) * 100 : 0

    // Orçamento Regionalizado (Total de Despesas vs Limite Legal)
    const financialItems = (financialData as Financial[]).filter(
      f => f.client_id === user.client_id && f.campaign_id === activeCampaign.id && !f.deleted_at,
    )

    const totalExpenses = financialItems
      .filter(f => f.is_expense)
      .reduce((acc, curr) => acc + Number(curr.value), 0)

    const legalLimit = activeCampaign.legal_spending_limit || 0
    const expenseRate = legalLimit > 0 ? (totalExpenses / legalLimit) * 100 : 0

    return {
      items,
      screen,
      metrics: {
        totalGoal,
        totalVotes,
        achievementRate,
        budget: {
          totalExpenses,
          legalLimit,
          expenseRate,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching regional planning data:', error)
    return null
  }
}
