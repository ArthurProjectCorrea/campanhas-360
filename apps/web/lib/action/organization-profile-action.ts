'use server'

import { getSession, hasPermission } from '@/lib/session'
import { ActionState, OrganizationProfileData } from '@/types'
import { forbidden } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

/**
 * Busca dados consolidados do perfil da organização (Candidato + Campanhas).
 */
export async function getOrganizationData(): Promise<OrganizationProfileData | null> {
  const session = await getSession()
  if (!session?.apiToken) {
    return null
  }

  if (!(await hasPermission('organization_profile', 'view'))) {
    forbidden()
  }

  try {
    const res = await fetch(`${API_URL}/organization-profile?t=${Date.now()}`, {
      headers: { Authorization: `Bearer ${session.apiToken}` },
      cache: 'no-store',
      next: { revalidate: 0 },
    })

    if (!res.ok) return null

    return (await res.json()) as OrganizationProfileData
  } catch (error) {
    console.error('Erro ao buscar dados da organização:', error)
    return null
  }
}

/**
 * Action unificada para salvar candidato/campanha, criar nova campanha ou inativar.
 */
export async function organizationProfileAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession()
  if (!session?.apiToken) return { success: false, message: 'Sessão expirada.' }

  const intent = formData.get('intent') as string
  console.log('--- organizationProfileAction ---')
  console.log('Intent:', intent)
  console.log('FormData:', Object.fromEntries(formData.entries()))

  try {
    // 1. INATIVAR CAMPANHA
    if (intent === 'inactivate') {
      const campaignId = formData.get('campaign_id')
      if (!campaignId) return { success: false, message: 'ID da campanha não informado.' }

      const res = await fetch(
        `${API_URL}/organization-profile/campaigns/${campaignId}/inactivate`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${session.apiToken}` },
        },
      )

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        return { success: false, message: error.message || 'Erro ao inativar campanha.' }
      }

      revalidatePath('/', 'layout')
      return { success: true, message: 'Campanha encerrada com sucesso.' }
    }

    // 2. CRIAR NOVA CAMPANHA
    if (intent === 'create') {
      if (!(await hasPermission('organization_profile', 'create'))) {
        return { success: false, message: 'Sem permissão para criar campanha.' }
      }

      const stateId = formData.get('state_id')
      const municipalityId = formData.get('municipality_id')
      const candidateNumber = Number(formData.get('candidate_number'))
      const electionYear = Number(formData.get('election_year'))
      const partyId = Number(formData.get('party_id'))
      const positionId = Number(formData.get('position_id'))

      if (!candidateNumber || !electionYear || !partyId || !positionId) {
        return { success: false, message: 'Número, Ano, Partido e Cargo são obrigatórios.' }
      }

      const payload = {
        candidateNumber,
        electionYear,
        partyId,
        positionId,
        stateId: stateId ? Number(stateId) : null,
        municipalityId: municipalityId ? Number(municipalityId) : null,
        legalSpendingLimit: Number(formData.get('legal_spending_limit')) / 100 || 0,
      }

      const res = await fetch(`${API_URL}/organization-profile/campaigns`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('Response Status:', res.status)

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        console.log('Error Response:', error)
        return { success: false, message: error.message || 'Erro ao criar campanha.' }
      }

      revalidatePath('/', 'layout')
      return { success: true, message: 'Nova campanha iniciada com sucesso.' }
    }

    // 3. SALVAR ALTERAÇÕES (Candidato + Campanha Ativa)
    if (!(await hasPermission('organization_profile', 'update'))) {
      return { success: false, message: 'Sem permissão para editar.' }
    }

    // Remapear campos para o padrão esperado pelo C# (MultipartFormData)
    const apiFormData = new FormData()
    apiFormData.append('CandidateName', formData.get('name') as string)
    apiFormData.append('BallotName', (formData.get('ballot_name') as string) || '')
    apiFormData.append('CPF', (formData.get('cpf') as string) || '')
    apiFormData.append('SocialName', (formData.get('social_name') as string) || '')
    apiFormData.append('BirthDate', (formData.get('birth_date') as string) || '')

    if (formData.get('campaign_id')) {
      apiFormData.append('CampaignId', formData.get('campaign_id') as string)

      const candidateNumber = formData.get('candidate_number')
      if (candidateNumber) apiFormData.append('CandidateNumber', candidateNumber as string)

      const electionYear = formData.get('election_year')
      if (electionYear) apiFormData.append('ElectionYear', electionYear as string)

      const partyId = formData.get('party_id')
      if (partyId) apiFormData.append('PartyId', partyId as string)

      const positionId = formData.get('position_id')
      if (positionId) apiFormData.append('PositionId', positionId as string)

      const stateId = formData.get('state_id')
      if (stateId) apiFormData.append('StateId', stateId as string)

      const municipalityId = formData.get('municipality_id')
      if (municipalityId) apiFormData.append('MunicipalityId', municipalityId as string)

      const spending = formData.get('legal_spending_limit')
      if (spending) {
        apiFormData.append('LegalSpendingLimit', (Number(spending) / 100).toString())
      }
    }

    // Adicionar o arquivo de avatar se presente
    const avatar = formData.get('avatar')
    if (avatar instanceof File && avatar.size > 0) {
      apiFormData.append('avatar', avatar)
    }

    const res = await fetch(`${API_URL}/organization-profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.apiToken}`,
      },
      body: apiFormData,
    })

    console.log('Update Response Status:', res.status)

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      console.log('Update Error Response:', error)
      return { success: false, message: error.message || 'Erro ao atualizar perfil.' }
    }

    revalidatePath('/')
    return { success: true, message: 'Alterações salvas com sucesso.' }
  } catch (error) {
    console.error('Erro na Action de Perfil:', error)
    return { success: false, message: 'Erro de comunicação com o servidor.' }
  }
}
