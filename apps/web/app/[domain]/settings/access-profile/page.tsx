import { PageHeader } from '@/components/layout/page-header'
import { AccessProfileTable } from '@/components/tables/access-profile-table'
import { getAccessProfileData } from '@/lib/action/access-profile-action'
import { redirect } from 'next/navigation'

export default async function AccessProfilePage({
  params,
}: {
  params: Promise<{ domain: string }>
}) {
  const { domain } = await params
  const data = await getAccessProfileData()

  if (!data) {
    redirect('/sign-in')
  }

  return (
    <>
      <PageHeader
        title={data.screen?.title || 'Perfil de Acesso'}
        description={data.screen?.description || 'Gerencie os perfis de acesso e permissões.'}
        breadcrumbs={[
          { label: 'Configurações' },
          { label: data.screen?.title || 'Perfil de Acesso' },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <AccessProfileTable
          data={data.accessProfiles}
          canUpdate={data.canUpdate}
          canDelete={data.canDelete}
          canCreate={data.canCreate}
          domain={domain}
        />
      </div>
    </>
  )
}
