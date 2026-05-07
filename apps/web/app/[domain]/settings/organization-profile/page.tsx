import { PageHeader } from '@/components/layout/page-header'
import { OrganizationProfileForm } from '@/components/forms/organization-profile-form'
import { getOrganizationData } from '@/lib/action/organization-profile-action'
import { redirect } from 'next/navigation'

export default async function OrganizationProfilePage({
  params,
}: {
  params: Promise<{ domain: string }>
}) {
  const data = await getOrganizationData()

  if (!data) {
    redirect('/sign-in')
  }

  return (
    <>
      <PageHeader
        title={data.screen?.title || 'Perfil da Organização'}
        description={data.screen?.description || 'Configure as informações da sua organização.'}
        breadcrumbs={[
          { label: 'Configurações' },
          { label: data.screen?.title || 'Perfil da Organização' },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <OrganizationProfileForm
          initialData={data.client}
          lookups={data.lookups}
          canUpdate={data.canUpdate}
        />
      </div>
    </>
  )
}
