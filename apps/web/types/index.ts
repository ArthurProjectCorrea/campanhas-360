export type ActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

export type SessionPayload = {
  userId: string
  domain: string
  expiresAt: Date
}

export type User = {
  id: string | number
  name: string
  email: string
  password?: string
  client_id: string | number
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export type Client = {
  id: string | number
  name?: string
  domain: string
  is_active: boolean
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}
