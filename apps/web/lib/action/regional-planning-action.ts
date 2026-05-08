'use server'

import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import users from '@/data/users.json'
import screens from '@/data/screens.json'
import regionalPlanningData from '@/data/regional-planning.json'
import financialData from '@/data/financial.json'
import campaignsData from '@/data/campaigns.json'
import { Screen, User, Access, RegionalPlanning, Financial, Campaign } from '@/types'
import { forbidden } from 'next/navigation'

export async function getRegionalPlanningData() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return null
  }

  // Verificação de permissão 'view' para a tela 'regional_planning'
  const hasViewPermission = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'regional_planning' && a.permission_key === 'view',
  )

  if (!hasViewPermission) {
    forbidden()
  }

  const currentUser = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
  if (!currentUser) return null

  const activeCampaign = (campaignsData as Campaign[]).find(
    c => c.client_id === currentUser.client_id && !c.deleted_at && c.is_active,
  )

  if (!activeCampaign) return null

  const screen = (screens as Screen[]).find(s => s.key === 'regional_planning')

  const items = (regionalPlanningData as RegionalPlanning[]).filter(
    p => p.campaign_id === activeCampaign.id && !p.deleted_at && p.is_active,
  )

  const totalGoal = items.reduce((acc, curr) => acc + curr.goal, 0)
  const totalVotes = items.reduce((acc, curr) => acc + curr.votes, 0)

  const achievementRate = totalGoal > 0 ? (totalVotes / totalGoal) * 100 : 0

  // Orçamento Regionalizado (Total de Despesas vs Limite Legal)
  const financialItems = (financialData as Financial[]).filter(
    f =>
      f.client_id === currentUser.client_id && f.campaign_id === activeCampaign.id && !f.deleted_at,
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
}
