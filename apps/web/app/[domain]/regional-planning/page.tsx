import { PageHeader } from '@/components/layout/page-header'
import { SectionCards, SectionCardItem } from '@/components/custom/section-cards'
import { getRegionalPlanningData } from '@/lib/action/regional-planning-action'
import { redirect } from 'next/navigation'

export default async function RegionalPlanningPage({
  params,
}: {
  params: Promise<{ domain: string }>
}) {
  await params
  const data = await getRegionalPlanningData()

  if (!data) {
    redirect('/sign-in')
  }

  const { metrics, screen } = data

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value)
  }

  const cards: SectionCardItem[] = [
    {
      title: 'Total de Votos (Meta vs. Pesquisa Atual)',
      value: `${metrics.achievementRate.toFixed(1)}%`,
      valueLabel: 'da meta alcançada',
      trend: metrics.achievementRate >= 100 ? 'up' : 'down',
      trendValue: `${metrics.achievementRate.toFixed(1)}%`,
      footerTitle: `Votos Atuais: ${new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(metrics.totalVotes)}`,
      footerDescription: `Meta: ${new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(metrics.totalGoal)} votos`,
      progress: metrics.achievementRate,
    },
    {
      title: 'Orçamento Regionalizado',
      value: `${metrics.budget.expenseRate.toFixed(1)}%`,
      valueLabel: 'do limite legal gasto',
      trend: metrics.budget.expenseRate <= 100 ? 'up' : 'down',
      trendValue: `${metrics.budget.expenseRate.toFixed(1)}%`,
      footerTitle: `Total Despesas: ${formatCurrency(metrics.budget.totalExpenses)}`,
      footerDescription: `Limite Legal: ${formatCurrency(metrics.budget.legalLimit)}`,
      progress: metrics.budget.expenseRate,
    },
  ]

  return (
    <>
      <PageHeader
        title={screen?.title || 'Planejamento Regional'}
        description={screen?.description || 'Acompanhe o planejamento regional da sua campanha.'}
        breadcrumbs={[{ label: 'Planejamento Regional' }]}
      />
      <div className="flex flex-1 flex-col gap-4">
        <SectionCards items={cards} />
      </div>
    </>
  )
}
