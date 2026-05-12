export type ActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: Record<string, unknown>
}

export type SessionPayload = {
  userId: string
  domain: string
  apiToken: string
  accessProfile?: AccessProfile
  permissions?: { screen: string; key: string; icon?: string; title?: string }[]
  expiresAt: Date
}

export type User = {
  id: string | number
  name: string
  email: string
  password?: string
  clientId?: string | number
  accessProfileId?: number | AccessProfile
  accessProfileName?: string
  access_profile_name?: string
  isActive?: boolean
  is_active?: boolean
  createdAt?: string
  created_at?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type Candidate = {
  id: number
  name: string
  avatarUrl?: string
  ballotName?: string
  cpf?: string
  socialName?: string
  birthDate?: string
  clientId?: string | number
}

export type Campaign = {
  id: number
  candidateId: number
  positionId: number
  positionName?: string
  municipalityId: number
  municipalityName?: string
  partyId: number
  partyName?: string
  stateId: number
  stateName?: string
  candidateNumber: number
  electionYear: number
  legalSpendingLimit: number
  isActive: boolean
  clientId: string | number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface PositionMetadata {
  id: number
  name: string
  type: string
}

export interface StateMetadata {
  id: number
  name: string
  acronym: string
}

export interface MunicipalityMetadata {
  id: number
  name: string
}

export interface PartyMetadata {
  id: number
  name: string
  acronym: string
}

export interface MetadataResponse {
  positions: PositionMetadata[]
  states: StateMetadata[]
  parties: PartyMetadata[]
}

export interface ScreenMetadata {
  key: string
  title: string
  description?: string
}

export interface OrganizationProfileData {
  screen: ScreenMetadata
  candidate: Candidate | null
  campaigns: Campaign[]
  permissions: {
    canUpdate: boolean
    canCreate: boolean
  }
  metadata: MetadataResponse
}

export type Screen = {
  id: number
  key: string
  title: string
  description?: string
  sidebar?: string
  icon?: string
}

export type AccessProfile = {
  id: string | number
  name: string
  isActive?: boolean
  clientId?: string | number
  accesses?: Access[]
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export type RegionalPlanning = {
  id: number
  name: string
  goal: number
  votes: number
  isActive: boolean
  campaignId: number
  clientId: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type Financial = {
  id: number
  isExpense: boolean
  value: string | number
  campaignId: number
  clientId: number
  regionalPlanningId: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

export type NavMainItem = {
  title: string
  url?: string
  icon?: string
  isActive?: boolean
  items?: {
    title: string
    url: string
    icon?: string
  }[]
}

export type SidebarData = {
  ballotName: string
  positionName: string
  avatarUrl: string
  candidateNumber: number
  electionYear: number
  partyName: string
  partySlug: string
  municipalityName: string
  stateAcronym: string
  hasActiveCampaign: boolean
  userName: string
  userEmail: string
  navMain: NavMainItem[]
}

export type Permission = {
  id: number
  key: string
  name: string
}

export type Access = {
  screenId: number
  screenKey?: string
  permissionId: number
  permissionKey?: string
}
