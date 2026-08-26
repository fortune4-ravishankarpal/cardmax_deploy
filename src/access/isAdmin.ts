import type { Access } from 'payload'
import type { User } from '@/payload-types'

export const checkIsAdmin = (user: User | null): boolean => {
  if (!user || !user.role) return false

  if (typeof user.role === 'object' && 'name' in user.role) {
    return user.role.name === 'admin' || user.role.name === 'super_admin'
  }

  // If role is just an ID (not populated), we can't easily check name here.
  // But in Admin UI, it's usually populated.
  return false
}

export const checkIsSuperAdmin = (user: User | null): boolean => {
  if (!user || !user.role) return false

  if (typeof user.role === 'object' && 'name' in user.role) {
    return user.role.name === 'super_admin'
  }

  return false
}

export const checkIsAdminOrUserAdmin = (user: User | null): boolean => {
  if (!user || !user.role) return false

  if (typeof user.role === 'object' && 'name' in user.role) {
    return (
      user.role.name === 'admin' ||
      user.role.name === 'super_admin' ||
      user.role.name === 'user admin'
    )
  }

  return false
}

export const isAdmin: Access = ({ req }) => {
  return checkIsAdmin(req?.user || null)
}

export const isSuperAdmin: Access = ({ req }) => {
  return checkIsSuperAdmin(req?.user || null)
}

export const isAdminOrUserAdmin: Access = ({ req }) => {
  return checkIsAdminOrUserAdmin(req?.user || null)
}
