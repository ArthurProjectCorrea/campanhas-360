import { PageHeader } from '@/components/layout/page-header'
import { AccessProfileForm } from '@/components/forms/access-profile-form'
import { getAccessProfileData } from '@/lib/action/access-profile-action'
import { redirect } from 'next/navigation'

export default async function NewAccessProfilePage({
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
        title="Novo Perfil de Acesso"
        description={
          data.screen?.description || 'Crie um novo perfil de permissões para sua equipe.'
        }
        breadcrumbs={[
          { label: 'Configurações' },
          { label: 'Perfil de Acesso', href: `/${domain}/settings/access-profile` },
          { label: 'Novo Perfil' },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <AccessProfileForm lookups={data.lookups} mode="create" domain={domain} />
      </div>
    </>
  )
}
