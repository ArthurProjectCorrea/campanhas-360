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
import screens from '@/data/screens.json'
import candidates from '@/data/candidates.json'
import { User, Client, ActionState, Screen, Access, Candidate } from '@/types'
import { revalidatePath } from 'next/cache'
import { forbidden } from 'next/navigation'

const CLIENTS_FILE_PATH = path.join(process.cwd(), 'data/clients.json')
const CANDIDATES_FILE_PATH = path.join(process.cwd(), 'data/candidates.json')

export async function getOrganizationData() {
  console.log('DEBUG: getOrganizationData starting')
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const payload = await decrypt(session)

  if (!payload || !payload.userId) {
    return null
  }

  // Verificação de permissão
  const hasViewPermission = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'organization_profile' && a.permission_key === 'view',
  )

  if (!hasViewPermission) {
    forbidden()
  }

  const user = (users as User[]).find(u => u.id.toString() === payload.userId.toString())
  if (!user) return null

  const client = (clients as Client[]).find(c => c.id === user.client_id)
  if (!client) {
    console.log('DEBUG: Client not found')
    return null
  }

  // Busca os dados do candidato para pegar o avatar_url correto
  const candidate = (candidates as Candidate[]).find(c => c.id === client.candidate_id)

  const clientWithCandidateData = {
    ...client,
    avatar_url: candidate?.avatar_url || '',
  }

  console.log('DEBUG: Client found', client.domain)

  const screen = (screens as Screen[]).find(s => s.key === 'organization_profile')

  const canUpdate = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'organization_profile' && a.permission_key === 'update',
  )

  return {
    client: clientWithCandidateData,
    screen,
    canUpdate,
    lookups: {
      positions: positions as { id: number; name: string }[],
      parties: parties as { id: number; name: string }[],
      municipalities: municipalities as { id: number; name: string }[],
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

  // Verificação de permissão de atualização
  const canUpdate = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'organization_profile' && a.permission_key === 'update',
  )

  if (!canUpdate) {
    return { success: false, message: 'Você não tem permissão para realizar esta ação.' }
  }

  const avatarFile = formData.get('avatar') as File | null
  const isRemoval = formData.get('avatar_remove') === 'true'

  try {
    const allClients = [...(clients as Client[])]
    const index = allClients.findIndex(c => c.id === user.client_id)

    if (index === -1) {
      return { success: false, message: 'Organização não encontrada.' }
    }

    const currentClient = allClients[index]
    let avatarUrl = ''

    // Busca o arquivo de candidatos
    const allCandidates = [...(candidates as Candidate[])]
    const candidateIndex = allCandidates.findIndex(c => c.id === currentClient.candidate_id)

    if (candidateIndex === -1) {
      return { success: false, message: 'Candidato não encontrado.' }
    }

    const currentCandidate = allCandidates[candidateIndex]
    avatarUrl = currentCandidate.avatar_url || ''

    // Lógica de remoção física do arquivo atual
    if (currentCandidate.avatar_url) {
      const oldPath = path.join(process.cwd(), 'public', currentCandidate.avatar_url)
      try {
        await fs.unlink(oldPath)
      } catch {
        // Ignora se o arquivo não existir
      }
    }

    if (isRemoval) {
      avatarUrl = ''
    } else if (avatarFile && avatarFile.size > 0) {
      const ext = path.extname(avatarFile.name) || '.jpg'
      // Nome previsível e limpo usando o ID do candidato
      const fileName = `avatar-${currentCandidate.id}${ext}`
      const storageDir = path.join(process.cwd(), 'public/storage')
      const filePath = path.join(storageDir, fileName)

      const buffer = Buffer.from(await avatarFile.arrayBuffer())
      await fs.writeFile(filePath, buffer)
      avatarUrl = `/storage/${fileName}`
    }

    // Atualiza o candidato imediatamente
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
    console.error('Erro no upload imediato:', error)
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

  // Verificação de permissão de atualização
  const canUpdate = payload.accessProfile?.accesses?.some(
    (a: Access) => a.screen_key === 'organization_profile' && a.permission_key === 'update',
  )

  if (!canUpdate) {
    return { success: false, message: 'Você não tem permissão para realizar esta ação.' }
  }

  const domain = formData.get('domain') as string
  const candidateNumber = Number(formData.get('candidate_number'))
  const electionYear = Number(formData.get('election_year'))
  const positionId = Number(formData.get('position_id'))
  const partyId = Number(formData.get('party_id'))
  const municipalityId = Number(formData.get('municipality_id'))

  // Validação simples
  if (!domain || !candidateNumber || !electionYear || !positionId || !partyId || !municipalityId) {
    return { success: false, message: 'Preencha todos os campos obrigatórios.' }
  }

  try {
    const allClients = [...(clients as Client[])]
    const index = allClients.findIndex(c => c.id === user.client_id)

    if (index === -1) {
      return { success: false, message: 'Organização não encontrada.' }
    }

    const currentClient = allClients[index]

    // Atualiza apenas os campos permitidos (avatar é gerenciado pelo upload imediato agora)
    allClients[index] = {
      ...currentClient,
      domain,
      candidate_number: candidateNumber,
      election_year: electionYear,
      position_id: positionId,
      party_id: partyId,
      municipality_id: municipalityId,
      updated_at: new Date().toISOString(),
    }

    await fs.writeFile(CLIENTS_FILE_PATH, JSON.stringify(allClients, null, 2))

    revalidatePath('/')

    return { success: true, message: 'Dados da organização atualizados com sucesso.' }
  } catch (error) {
    console.error('Erro ao salvar organização:', error)
    return { success: false, message: 'Erro ao salvar as alterações no banco de dados.' }
  }
}
