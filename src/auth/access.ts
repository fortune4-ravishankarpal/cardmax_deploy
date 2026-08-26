import type { Access } from 'payload'

const isAdmin = (user: unknown): boolean => {
  const u = user as { collection?: string } | null
  return Boolean(u && u.collection === 'admin')
}

export const usersReadAccess: Access = ({ req }) => {
  const user = (req.user as { collection?: string; id?: number } | null) || null
  if (!user) return false
  if (isAdmin(user)) return true
  return { id: { equals: user.id } }
}

export const usersCreateAccess: Access = ({ req }) => {
  return isAdmin(req.user)
}

export const usersUpdateAccess: Access = ({ req }) => {
  const user = (req.user as { collection?: string; id?: number } | null) || null
  if (!user) return false
  if (isAdmin(user)) return true
  return { id: { equals: user.id } }
}

export const usersDeleteAccess: Access = ({ req }) => {
  return isAdmin(req.user)
}