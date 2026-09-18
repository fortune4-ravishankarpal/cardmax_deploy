import type { Access, AccessArgs } from 'payload'

import { checkIsAdmin, checkIsSuperAdmin } from '@/access/isAdmin'
import { hasApiPermission } from '@/access/apiPermissionEngine'
import type { Admin } from '@/payload-types'

/**
 * Access control for the secure `cards` collection.
 *
 * Rows are scoped to the owning user (or visible to all admins..
 * Field-level access (see the collection config) hides all ciphertext and
 * internal fields from REST/GraphQL/admin responses..
 *
 * Revealing a full PAN requires either:
 * - the owning user (for their own card, with audit), or
 * - an admin whose role explicitly grants it — `super_admin`, or a role with a
 *   `cards.reveal` / `cards.*` / `cards.manage` / `*`-style permission..
 */

/** Permission string that explicitly grants full-PAN reveal to admin roles. */
export const CARD_REVEAL_PERMISSION = 'cards.reveal'

/** Extract permission strings from an admin user's (possibly unpopulated) role. */
const rolePermissions = (user: Admin | null): string[] => {
  if (!user?.role || typeof user.role === 'string') return []
  const perms = (user.role as { permissions?: unknown }).permissions
  return Array.isArray(perms) ? perms.filter((p): p is string => typeof p === 'string') : []
}

/** Can this admin read/manage stored card records (masked view)? */
export const canManageCards = (user: Admin | null): boolean => {
  if (!user) return false
  if (checkIsSuperAdmin(user)) return true
  const perms = rolePermissions(user)
  return perms.some((p) =>
    ['*', '*.*', '*.manage', 'cards.*', 'cards.manage', CARD_REVEAL_PERMISSION].includes(p),
  )
}

/** Can this admin reveal a full PAN? Explicit role grant required (safe default: no). */
export const canRevealCardPan = (user: Admin | null): boolean => {
  if (!user) return false
  if (checkIsSuperAdmin(user)) return true
  const perms = rolePermissions(user)
  return perms.some((p) =>
    ['*', '*.*', 'cards.*', 'cards.manage', CARD_REVEAL_PERMISSION].includes(p),
  )
}

const isAdminCollectionUser = (user: unknown): boolean =>
  Boolean(user && (user as { collection?: string }).collection === 'admin')

const isUsersCollectionUser = (user: unknown): boolean =>
  Boolean(user && (user as { collection?: string }).collection === 'users')

/** Collection-level read: API users check permissions; owning users see only their cards; admins see all */
export const cardsReadAccess: Access = ({ req }) => {
  const user = req.user
  if (!user) return false
  if (hasApiPermission(req, 'cards', 'read')) return true
  if (isAdminCollectionUser(user)) return true
  if (isUsersCollectionUser(user)) return { user: { equals: (user as { id: string }).id } }
  return false
}

/** Creation: API users with 'create' permission or server-side internal */
export const cardsCreateAccess: Access = ({ req }) => {
  if (hasApiPermission(req, 'cards', 'create')) return true
  return false
}

/** Update: API users with 'update' permission, owning user, or any admin */
export const cardsUpdateAccess: Access = ({ req }) => {
  const user = req.user
  if (!user) return false
  if (hasApiPermission(req, 'cards', 'update')) return true
  if (isAdminCollectionUser(user)) return true
  if (isUsersCollectionUser(user)) return { user: { equals: (user as { id: string }).id } }
  return false
}

/** Delete: API users with 'delete' permission, owning user, or any admin */
export const cardsDeleteAccess: Access = ({ req }) => {
  const user = req.user
  if (!user) return false
  if (hasApiPermission(req, 'cards', 'delete')) return true
  if (isAdminCollectionUser(user)) return true
  if (isUsersCollectionUser(user)) return { user: { equals: (user as { id: string }).id } }
  return false
}

/**
 * Field-level read guard for the user relationship field — users may only read
 * their own cards (admins may read all.
 */
export const cardOwnerFieldReadAccess: Access = ({ req }) => {
  const user = req.user
  if (!user) return false
  if (isAdminCollectionUser(user)) return true
  if (isUsersCollectionUser(user)) return true // row scope already limits owners
  return false
}

/** Fields that must never be readable/writable from the API or admin UI. */
export const denySensitiveFieldAccess = {
  read: () => false,
  create: () => false,
  update: () => false,
} as const

/** Admin panel visibility for the cards collection — admins only. */
export const cardsAdminAccess: ({ req }: AccessArgs) => boolean = ({ req }) => {
  const user = req.user
  if (!user) return false
  if (!isAdminCollectionUser(user)) return false
  return checkIsAdmin(user as Admin)
}