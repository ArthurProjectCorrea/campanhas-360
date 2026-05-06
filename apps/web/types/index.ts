export type ActionState = {
  success?: boolean
  message?: string
  errors?: Record<string, string[]>
}

export type SessionPayload = {
  userId: string
  expiresAt: Date
}

export type User = {
  id: string
  name: string
  email: string
  password?: string
}
