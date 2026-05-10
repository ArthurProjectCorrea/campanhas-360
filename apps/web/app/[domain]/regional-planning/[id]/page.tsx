import { PageHeader } from '@/components/layout/page-header'
import { redirect } from 'next/navigation'

export default async function RegionalPlanningDetailPage({
  params,
}: {
  params: Promise<{ domain: string; id: string }>
}) {
  const { id } = await params

  return (
    <>
      <PageHeader
        title="Detalhes do Planejamento"
        description={`Visualizando detalhes do planejamento regional ID: ${id}`}
        breadcrumbs={[
          { label: 'Planejamento Regional', href: '/regional-planning' },
          { label: 'Detalhes' },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <p>Conteúdo do planejamento regional {id} em desenvolvimento.</p>
      </div>
    </>
  )
}
