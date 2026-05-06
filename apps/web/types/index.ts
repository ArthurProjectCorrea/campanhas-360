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
  id: string
  name: string
  email: string
  password?: string
  client_id: string
  is_active: boolean
}

export type Client = {
  id: string
  name: string
  domain: string
  is_active: boolean
}
