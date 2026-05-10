import { PageHeader } from '@/components/layout/page-header'

export default async function NewRegionalPlanningPage({
  params,
}: {
  params: Promise<{ domain: string }>
}) {
  const { domain } = await params

  return (
    <>
      <PageHeader
        title="Novo Planejamento"
        description="Crie um novo planejamento regional para sua campanha."
        breadcrumbs={[
          { label: 'Planejamento Regional', href: `/${domain}/regional-planning` },
          { label: 'Novo' },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <p>Formulário de novo planejamento regional em desenvolvimento.</p>
      </div>
    </>
  )
}
