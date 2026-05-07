import { PageHeader } from '@/components/layout/page-header'
import { UserRegistrationTable } from '@/components/tables/user-registration-table'
import { getUserRegistrationData } from '@/lib/action/user-registration-action'
import { redirect } from 'next/navigation'

export default async function UserRegistrationPage({
  params,
}: {
  params: Promise<{ domain: string }>
}) {
  const data = await getUserRegistrationData()

  if (!data) {
    redirect('/sign-in')
  }

  return (
    <>
      <PageHeader
        title={data.screen?.title || 'Cadastro de Usuários'}
        description={data.screen?.description || 'Gerencie os usuários que têm acesso ao sistema.'}
        breadcrumbs={[
          { label: 'Configurações' },
          { label: data.screen?.title || 'Cadastro de Usuários' },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <UserRegistrationTable
          data={data.users}
          canUpdate={data.canUpdate}
          canDelete={data.canDelete}
          canCreate={data.canCreate}
          accessProfiles={data.lookups.accessProfiles}
        />
      </div>
    </>
  )
}
