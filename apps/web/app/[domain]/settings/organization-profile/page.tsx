import { PageHeader } from '@/components/layout/page-header'
import { OrganizationProfileForm } from '@/components/forms/organization-profile-form'
import { getOrganizationData } from '@/lib/action/organization-profile-action'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface OrganizationProfilePageProps {
  params: Promise<{ domain: string }>
}

export default async function OrganizationProfilePage({ params }: OrganizationProfilePageProps) {
  const { domain } = await params
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
      <div className="flex flex-1 flex-col gap-6 p-4">
        <OrganizationProfileForm data={data} domain={domain} />
      </div>
    </>
  )
}
