import type { CollectionConfig, PayloadRequest } from 'payload'

export type ApiOperation = 'read' | 'create' | 'update' | 'delete'

export interface UserPermission {
  collection: string
  methods: ApiOperation[]
}

/**
 * Standard HTTP Method to Payload Operation Mapping.
 */
export const HTTP_METHOD_TO_OPERATION: Record<string, ApiOperation> = {
  get: 'read',
  post: 'create',
  put: 'update',
  patch: 'update',
  delete: 'delete',
}

/**
 * Maps an HTTP method string to an ApiOperation.
 */
export const mapHttpMethodToOperation = (method: string): ApiOperation | null => {
  const normalized = method.toLowerCase()
  return HTTP_METHOD_TO_OPERATION[normalized] ?? null
}

/**
 * Checks if a user has access as an Admin (CMS admin or API user with 'admin' role).
 */
export const isApiAdmin = (user: unknown): boolean => {
  if (!user || typeof user !== 'object') return false
  const u = user as { collection?: string; role?: string; status?: string }

  // CMS Superadmin
  if (u.collection === 'admin') return true

  // API Admin
  if (u.collection === 'api-users') {
    if (u.status === 'inactive') return false
    return u.role === 'admin'
  }

  return false
}

/**
 * Central Permission Engine:
 * Determines if the current request has permission to perform `operation` on `collectionSlug`.
 *
 * Rules:
 * 1. Unauthenticated -> DENY (false)
 * 2. Admin (CMS admin or API user with role='admin') -> ALLOW (true)
 * 3. Developer (API user with role='developer'):
 *    - Inactive -> DENY (false)
 *    - Matches collection and method in explicit permissions -> ALLOW (true)
 *    - Otherwise -> DENY (false)
 * 4. All other users (e.g. customer mobile users) -> DENY (false)
 */
export const hasApiPermission = (
  req: PayloadRequest,
  collectionSlug: string,
  operation: ApiOperation
): boolean => {
  const user = req.user as {
    collection?: string
    role?: string
    status?: string
    permissions?: UserPermission[]
  } | null

  if (!user) return false

  // 1. CMS Superadmins have full access to all collections and operations
  if (user.collection === 'admin') return true

  // 2. API Users
  if (user.collection === 'api-users') {
    if (user.status === 'inactive') return false

    // API Admin has full access
    if (user.role === 'admin') return true

    // API Developer: check explicit assigned permissions
    if (user.role === 'developer') {
      const permissions = user.permissions || []
      const targetSlug = collectionSlug.toLowerCase()

      const match = permissions.find(
        (p) => p.collection && p.collection.toLowerCase() === targetSlug
      )

      if (match && Array.isArray(match.methods)) {
        return match.methods.includes(operation)
      }

      return false
    }
  }

  // 3. Deny by default
  return false
}

/**
 * Reusable Collection Access Factory.
 * Applies the central permission engine across all CRUD operations.
 */
export const createApiAccess = (collectionSlug: string): NonNullable<CollectionConfig['access']> => {
  return {
    read: ({ req }) => hasApiPermission(req, collectionSlug, 'read'),
    create: ({ req }) => hasApiPermission(req, collectionSlug, 'create'),
    update: ({ req }) => hasApiPermission(req, collectionSlug, 'update'),
    delete: ({ req }) => hasApiPermission(req, collectionSlug, 'delete'),
    admin: ({ req }) => req.user?.collection === 'admin',
  }
}
