export type ActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: Record<string, unknown>
}

export type SessionPayload = {
  userId: string
  domain: string
  accessProfile?: AccessProfile
  expiresAt: Date
}

export type User = {
  id: string | number
  name: string
  email: string
  password?: string
  client_id: string | number
  access_profile_id: number | AccessProfile
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface UserRegistration extends User {
  access_profile_name: string
}

export type Permission = {
  id: number
  key: string
  name: string
}

export type Screen = {
  id: number
  key: string
  title: string
  description?: string
  sidebar?: string
  icon: string
}

export type Access = {
  access_profile_id: number
  permission_id: number
  screen_id: number
  permission_key?: string
  screen_key?: string
}

export type AccessProfile = {
  id: number
  name: string
  is_active: boolean
  accesses: Access[]
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export type Client = {
  id: string | number
  name?: string
  domain: string
  candidate_id: string | number
  position_id: string | number
  municipality_id: string | number
  party_id: string | number
  candidate_number: number
  election_year: number
  avatar_url?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export type Candidate = {
  id: string | number
  candidate_name: string
  ballot_name: string
  social_name?: string
  avatar_url?: string
  birth_date: string
  schooling_id: number
  state_of_birth_id: number
  gender_id: number
  marital_status_id: number
  color_race_id: number
  occupation_id: number
}

export type Position = {
  id: string | number
  name: string
}

export type NavMainItem = {
  title: string
  url?: string
  icon?: string
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export type SidebarData = {
  ballot_name: string
  position_name: string
  avatar_url: string
  candidate_number: number
  election_year: number
  party_name: string
  party_slug: string
  municipality_name: string
  user_name: string
  user_email: string
  navMain: NavMainItem[]
}
