'use server'

import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import fs from 'node:fs/promises'
import path from 'node:path'
import users from '@/data/users.json'
import clients from '@/data/clients.json'
import positions from '@/data/positions.json'
import parties from '@/data/party.json'
import municipalities from '@/data/municipalities.json'
import candidates from '@/data/candidates.json'
import campaigns from '@/data/campaigns.json'
import { User, Client, ActionState, Screen, Access, Candidate, Campaign } from '@/types'
import { revalidatePath } from 'next/cache'
import { forbidden } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

const CLIENTS_FILE_PATH = path.join(process.cwd(), 'data/clients.json')
const CANDIDATES_FILE_PATH = path.join(process.cwd(), 'data/candidates.json')
const CAMPAIGNS_FILE_PATH = path.join(process.cwd(), 'data/campaigns.json')

export async function getOrganizationData() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return null
  }

  // Verificação de permissão view
  const hasViewPermission = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'organization_profile' && a.permission_key === 'view',
  )

  if (!hasViewPermission) {
    forbidden()
  }

  const user = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
  if (!user) return null

  const client = (clients as Client[]).find(c => c.id === user.client_id)
  if (!client) return null

  // Busca os dados das campanhas vinculadas ao cliente
  const clientCampaigns = (campaigns as Campaign[])
    .filter(c => c.client_id === user.client_id && !c.deleted_at)
    .sort((a, b) => {
      if (a.is_active && !b.is_active) return -1
      if (!a.is_active && b.is_active) return 1
      return b.id - a.id
    })

  // Busca o avatar do candidato da campanha ativa para o form de perfil
  const activeCampaign = clientCampaigns.find(c => c.is_active)
  let avatar_url = ''
  if (activeCampaign) {
    const candidate = (candidates as Candidate[]).find(c => c.id === activeCampaign.candidate_id)
    avatar_url = candidate?.avatar_url || ''
  }

  const clientWithAvatar = {
    ...client,
    avatar_url,
  }

  // Permissões específicas (Verifica por key ou por ID como fallback)
  const canCreate = payload.accessProfile?.accesses?.some(
    (a: Access) =>
      (a.screen_key === 'organization_profile' || a.screen_id === 3) &&
      (a.permission_key === 'create' || a.permission_id === 4),
  )
  const canUpdate = payload.accessProfile?.accesses?.some(
    (a: Access) =>
      (a.screen_key === 'organization_profile' || a.screen_id === 3) &&
      (a.permission_key === 'update' || a.permission_id === 2),
  )
  const canDelete = payload.accessProfile?.accesses?.some(
    (a: Access) =>
      (a.screen_key === 'organization_profile' || a.screenId === 3 || a.screen_id === 3) &&
      (a.permissionKey === 'delete' || a.permissionId === 3 || a.permission_id === 3),
  )

  const screensRes = await fetch(`${API_URL}/screens`, {
    headers: { Authorization: `Bearer ${payload.apiToken}` },
  })
  const screens = (await screensRes.json()) as Screen[]
  const screen = screens.find(s => s.key === 'organization_profile')

  return {
    client: clientWithAvatar,
    campaigns: clientCampaigns,
    screen,
    canCreate,
    canUpdate,
    canDelete,
    lookups: {
      positions: positions as { id: number; name: string }[],
      parties: parties as { id: number; name: string }[],
      municipalities: municipalities as { id: number; name: string }[],
      candidates: candidates as Candidate[],
    },
  }
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionState> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return { success: false, message: 'Sessão expirada.' }
  }

  const user = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
  if (!user) return { success: false, message: 'Usuário não encontrado.' }

  const canUpdate = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'organization_profile' && a.permission_key === 'update',
  )

  if (!canUpdate) {
    return { success: false, message: 'Você não tem permissão para realizar esta ação.' }
  }

  const avatarFile = formData.get('avatar') as File | null
  const isRemoval = formData.get('avatar_remove') === 'true'

  try {
    const activeCampaign = (campaigns as Campaign[]).find(
      c => c.client_id === user.client_id && c.is_active && !c.deleted_at,
    )

    if (!activeCampaign) {
      return { success: false, message: 'Nenhuma campanha ativa encontrada para vincular a foto.' }
    }

    const allCandidates = [...(candidates as Candidate[])]
    const candidateIndex = allCandidates.findIndex(c => c.id === activeCampaign.candidate_id)

    if (candidateIndex === -1) {
      return { success: false, message: 'Candidato não encontrado.' }
    }

    const currentCandidate = allCandidates[candidateIndex]
    let avatarUrl = currentCandidate.avatar_url || ''

    if (currentCandidate.avatar_url) {
      const oldPath = path.join(process.cwd(), 'public', currentCandidate.avatar_url)
      try {
        await fs.unlink(oldPath)
      } catch {}
    }

    if (isRemoval) {
      avatarUrl = ''
    } else if (avatarFile && avatarFile.size > 0) {
      const ext = path.extname(avatarFile.name) || '.jpg'
      const fileName = `avatar-${currentCandidate.id}-${Date.now()}${ext}`
      const storageDir = path.join(process.cwd(), 'public/storage')
      const filePath = path.join(storageDir, fileName)

      const buffer = Buffer.from(await avatarFile.arrayBuffer())
      await fs.writeFile(filePath, buffer)
      avatarUrl = `/storage/${fileName}`
    }

    allCandidates[candidateIndex] = {
      ...currentCandidate,
      avatar_url: avatarUrl,
    }

    await fs.writeFile(CANDIDATES_FILE_PATH, JSON.stringify(allCandidates, null, 2))
    revalidatePath('/')

    return {
      success: true,
      message: isRemoval ? 'Foto removida.' : 'Foto atualizada com sucesso.',
      data: { avatar_url: avatarUrl },
    }
  } catch (error) {
    console.error('Erro no upload:', error)
    return { success: false, message: 'Erro ao processar o upload.' }
  }
}

export async function updateOrganizationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return { success: false, message: 'Sessão expirada.' }
  }

  const user = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
  if (!user) return { success: false, message: 'Usuário não encontrado.' }

  const canUpdate = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'organization_profile' && a.permission_key === 'update',
  )

  if (!canUpdate) {
    return { success: false, message: 'Sem permissão.' }
  }

  const domain = formData.get('domain') as string

  if (!domain) {
    return { success: false, message: 'Domínio é obrigatório.' }
  }

  try {
    const allClients = [...(clients as Client[])]
    const index = allClients.findIndex(c => c.id === user.client_id)

    if (index === -1) return { success: false, message: 'Não encontrado.' }

    allClients[index] = {
      ...allClients[index],
      domain,
      updated_at: new Date().toISOString(),
    }

    await fs.writeFile(CLIENTS_FILE_PATH, JSON.stringify(allClients, null, 2))
    revalidatePath('/')
    return { success: true, message: 'Organização atualizada.' }
  } catch {
    return { success: false, message: 'Erro ao salvar.' }
  }
}

export async function createCampaignAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) return { success: false, message: 'Sessão expirada.' }

  const user = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
  if (!user) return { success: false, message: 'Usuário não encontrado.' }

  const canCreate = payload.accessProfile?.accesses?.some(
    (a: Access) =>
      (a.screen_key === 'organization_profile' || a.screen_id === 3) &&
      (a.permission_key === 'create' || a.permission_id === 4),
  )

  if (!canCreate) return { success: false, message: 'Sem permissão.' }

  const candidateId = Number(formData.get('candidate_id'))
  const positionId = Number(formData.get('position_id'))
  const municipalityId = Number(formData.get('municipality_id'))
  const partyId = Number(formData.get('party_id'))
  const candidateNumber = Number(formData.get('candidate_number'))
  const electionYear = Number(formData.get('election_year'))

  if (
    !candidateId ||
    !positionId ||
    !municipalityId ||
    !partyId ||
    !candidateNumber ||
    !electionYear
  ) {
    return { success: false, message: 'Preencha todos os campos obrigatórios.' }
  }

  try {
    const allCampaigns = [...(campaigns as Campaign[])]
    const isActive = formData.get('is_active') === 'on'

    // Se a nova campanha for ativa, inativa campanhas anteriores do mesmo cliente
    if (isActive) {
      allCampaigns.forEach((c, i) => {
        if (c.client_id === user.client_id && c.is_active && !c.deleted_at) {
          allCampaigns[i].is_active = false
          allCampaigns[i].updated_at = new Date().toISOString()
        }
      })
    }

    const newCampaign: Campaign = {
      id: Math.max(...allCampaigns.map(c => c.id), 0) + 1,
      candidate_id: candidateId,
      position_id: positionId,
      municipality_id: municipalityId,
      party_id: partyId,
      candidate_number: candidateNumber,
      election_year: electionYear,
      legal_spending_limit: Number(formData.get('legal_spending_limit')) / 100,
      is_active: isActive,
      client_id: user.client_id as number,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }

    allCampaigns.push(newCampaign)
    await fs.writeFile(CAMPAIGNS_FILE_PATH, JSON.stringify(allCampaigns, null, 2))
    revalidatePath('/')
    return { success: true, message: isActive ? 'Campanha criada e ativada.' : 'Campanha criada.' }
  } catch {
    return { success: false, message: 'Erro ao criar.' }
  }
}

export async function updateCampaignAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) return { success: false, message: 'Sessão expirada.' }

  const canUpdate = payload.accessProfile?.accesses?.some(
    (a: Access) =>
      (a.screen_key === 'organization_profile' || a.screen_id === 3) &&
      (a.permission_key === 'update' || a.permission_id === 2),
  )

  if (!canUpdate) return { success: false, message: 'Sem permissão.' }

  const user = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
  if (!user) return { success: false, message: 'Usuário não encontrado.' }

  const id = Number(formData.get('id'))
  const candidateId = Number(formData.get('candidate_id'))
  const positionId = Number(formData.get('position_id'))
  const municipalityId = Number(formData.get('municipality_id'))
  const partyId = Number(formData.get('party_id'))
  const candidateNumber = Number(formData.get('candidate_number'))
  const electionYear = Number(formData.get('election_year'))
  const legalSpendingLimit = Number(formData.get('legal_spending_limit'))
  const isActive = formData.get('is_active') === 'on'

  if (
    !id ||
    !candidateId ||
    !positionId ||
    !municipalityId ||
    !partyId ||
    !candidateNumber ||
    !electionYear ||
    !legalSpendingLimit
  ) {
    return { success: false, message: 'Preencha todos os campos obrigatórios.' }
  }

  try {
    const allCampaigns = [...(campaigns as Campaign[])]
    const index = allCampaigns.findIndex(c => c.id === id)

    if (index === -1) return { success: false, message: 'Não encontrada.' }

    // Se estiver ativando esta campanha, inativa as outras
    if (isActive && !allCampaigns[index].is_active) {
      allCampaigns.forEach((c, i) => {
        if (c.client_id === user.client_id && c.is_active && !c.deleted_at && c.id !== id) {
          allCampaigns[i].is_active = false
          allCampaigns[i].updated_at = new Date().toISOString()
        }
      })
    }

    allCampaigns[index] = {
      ...allCampaigns[index],
      candidate_id: candidateId,
      position_id: positionId,
      municipality_id: municipalityId,
      party_id: partyId,
      candidate_number: candidateNumber,
      election_year: electionYear,
      legal_spending_limit: Number(formData.get('legal_spending_limit')) / 100,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    }

    await fs.writeFile(CAMPAIGNS_FILE_PATH, JSON.stringify(allCampaigns, null, 2))
    revalidatePath('/')
    return { success: true, message: 'Campanha atualizada.' }
  } catch {
    return { success: false, message: 'Erro ao salvar.' }
  }
}

export async function deleteCampaignAction(formData: FormData): Promise<ActionState> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) return { success: false, message: 'Sessão expirada.' }

  const canDelete = payload.accessProfile?.accesses?.some(
    (a: Access) =>
      (a.screen_key === 'organization_profile' || a.screen_id === 3) &&
      (a.permission_key === 'delete' || a.permission_id === 3),
  )

  if (!canDelete) return { success: false, message: 'Sem permissão.' }

  const id = Number(formData.get('id'))

  try {
    const allCampaigns = [...(campaigns as Campaign[])]
    const index = allCampaigns.findIndex(c => c.id === id)

    if (index === -1) return { success: false, message: 'Não encontrada.' }

    allCampaigns[index].deleted_at = new Date().toISOString()
    allCampaigns[index].is_active = false

    await fs.writeFile(CAMPAIGNS_FILE_PATH, JSON.stringify(allCampaigns, null, 2))
    revalidatePath('/')
    return { success: true, message: 'Campanha excluída.' }
  } catch {
    return { success: false, message: 'Erro ao excluir.' }
  }
}
