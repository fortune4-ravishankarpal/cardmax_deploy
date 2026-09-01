import type { Access } from 'payload'
import type { Admin } from '@/payload-types'

export const checkIsAdmin = (user: Admin | null): boolean => {
  if (!user || !user.role) return false

  if (typeof user.role === 'object' && 'name' in user.role) {
    return user.role.name === 'admin' || user.role.name === 'super_admin'
  }

  // If role is just an ID (not populated), we can't easily check name here.
  // But in Admin UI, it's usually populated.
  return false
}

export const checkIsSuperAdmin = (user: Admin | null): boolean => {
  if (!user || !user.role) return false

  if (typeof user.role === 'object' && 'name' in user.role) {
    return user.role.name === 'super_admin'
  }

  return false
}

export const checkIsAdminOrUserAdmin = (user: Admin | null): boolean => {
  if (!user || !user.role) return false

  if (typeof user.role === 'object' && 'name' in user.role) {
    return (
      user.role.name === 'admin' || user.role.name === 'super_admin')
  }

  return false
}

export const isAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'admin') {
    return checkIsAdmin(req?.user || null)
  } else {
    return false
  }
}

export const isSuperAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'admin') {
    return checkIsSuperAdmin(req?.user || null)
  } else {
    return false
  }
}

export const isAdminOrUserAdmin: Access = ({ req }) => {
  if (req.user?.collection === 'admin') {
    return checkIsAdminOrUserAdmin(req?.user || null)
  } else {
    return false
  }
}
