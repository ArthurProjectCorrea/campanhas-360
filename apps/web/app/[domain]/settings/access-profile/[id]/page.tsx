import { PageHeader } from '@/components/layout/page-header'
import { AccessProfileForm } from '@/components/forms/access-profile-form'
import { getAccessProfileData, getAccessProfileById } from '@/lib/action/access-profile-action'
import { redirect, notFound } from 'next/navigation'

export default async function EditAccessProfilePage({
  params,
}: {
  params: Promise<{ domain: string; id: string }>
}) {
  const { domain, id } = await params
  const data = await getAccessProfileData()
  const profile = await getAccessProfileById(id)

  if (!data) {
    redirect('/sign-in')
  }

  if (!profile) {
    notFound()
  }

  const mode = data.canUpdate ? 'edit' : 'view'

  return (
    <>
      <PageHeader
        title={mode === 'edit' ? `Editar ${profile.name}` : `Visualizar ${profile.name}`}
        description={
          data.screen?.description || 'Gerencie as permissões e configurações deste perfil.'
        }
        breadcrumbs={[
          { label: 'Configurações' },
          { label: 'Perfil de Acesso', href: `/${domain}/settings/access-profile` },
          { label: profile.name },
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <AccessProfileForm
          initialData={profile}
          lookups={data.lookups}
          canUpdate={data.canUpdate}
          mode={mode}
          domain={domain}
        />
      </div>
    </>
  )
}
