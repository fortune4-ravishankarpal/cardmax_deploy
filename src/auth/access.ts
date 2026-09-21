import type { Access } from 'payload'
import { hasApiPermission } from '@/access/apiPermissionEngine'

export const usersReadAccess: Access = ({ req }) => {
  const user = (req.user as { collection?: string; id?: string | number } | null) || null
  if (!user) return false

  // 1. CMS Superadmins or API Users with 'read' permission on 'users' collection
  if (hasApiPermission(req, 'users', 'read')) {
    return true
  }

  // 2. Regular customer users (collection === 'users') can only view their own user record
  if (user.collection === 'users') {
    return { id: { equals: user.id } }
  }

  return false
}

export const usersCreateAccess: Access = ({ req }) => {
  return hasApiPermission(req, 'users', 'create')
}

export const usersUpdateAccess: Access = ({ req }) => {
  const user = (req.user as { collection?: string; id?: string | number } | null) || null
  if (!user) return false

  // 1. CMS Superadmins or API Users with 'update' permission on 'users'
  if (hasApiPermission(req, 'users', 'update')) {
    return true
  }

  // 2. Regular customer users can only update their own record
  if (user.collection === 'users') {
    return { id: { equals: user.id } }
  }

  return false
}

export const usersDeleteAccess: Access = ({ req }) => {
  return hasApiPermission(req, 'users', 'delete')
}