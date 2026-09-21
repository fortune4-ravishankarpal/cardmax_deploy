import type { PayloadRequest } from 'payload'
import { buildOpenApiDocument } from '@seshuk/payload-plugin-openapi'
import { hasApiPermission, HTTP_METHOD_TO_OPERATION } from '@/access/apiPermissionEngine'
import { sortTags, TAG_METADATA } from './tagOrder'

let cachedBaseDoc: any = null

const deriveServerUrl = (req: PayloadRequest): string => {
  const host = req.headers.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https'
  return `${protocol}://${host}`
}

const OBSOLETE_AUTH_PATHS = [
  '/api/users/login',
  '/api/users/forgot-password',
  '/api/users/reset-password',
  '/api/users/unlock',
]

/**
 * Generates or retrieves the cached base OpenAPI document.
 */
export const getBaseOpenApiDocument = async (req: PayloadRequest) => {
  if (cachedBaseDoc && process.env.NODE_ENV === 'production') {
    return cachedBaseDoc
  }

  const resolvedOptions: any = {
    metadata: {
      title: 'CardMax API',
      version: '1.0.0',
      description: 'API documentation for CardMax Payload CMS',
    },
    openapiVersion: '3.1',
    specEndpoint: '/openapi.json',
    serve: true,
    filters: {
      include: [],
      exclude: ['admin'], // Hide internal admin collection by default from API specs
      includeHidden: false,
      includeSystem: false,
      includeCustom: true,
      includeAuth: true,
      includeAdminAuth: false,
      includeVersions: false,
      includeJobs: false,
      excludeOperations: [],
    },
    interactiveAuth: { enabled: true, endpoint: '/openapi-auth' },
    nestedTags: false,
    cache: process.env.NODE_ENV === 'production',
    extensions: [],
  }

  cachedBaseDoc = await buildOpenApiDocument({
    payload: req.payload,
    options: resolvedOptions,
    language: 'en',
  })

  // Remove obsolete password-based auth endpoints from Swagger
  if (cachedBaseDoc?.paths) {
    for (const path of OBSOLETE_AUTH_PATHS) {
      delete cachedBaseDoc.paths[path]
    }
  }

  // Ensure all active tags are present, have descriptive metadata, and are sorted
  const allDocTags = new Set<string>()
  for (const [, pathItem] of Object.entries(cachedBaseDoc?.paths || {})) {
    if (!pathItem || typeof pathItem !== 'object') continue
    for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
      const opTags = (pathItem as any)?.[method]?.tags
      if (Array.isArray(opTags)) {
        opTags.forEach((t: string) => allDocTags.add(t))
      }
    }
  }

  const existingTags = Array.isArray(cachedBaseDoc?.tags) ? cachedBaseDoc.tags : []
  const tagMap = new Map<string, any>(existingTags.map((t: any) => [t.name, t]))

  cachedBaseDoc.tags = sortTags(
    Array.from(allDocTags).map(
      (tagName) =>
        tagMap.get(tagName) || {
          name: tagName,
          description: TAG_METADATA[tagName]?.description || `${tagName} Endpoints`,
        }
    )
  )

  return cachedBaseDoc
}

/**
 * Dynamic, authenticated OpenAPI Spec Handler.
 * Returns a customized OpenAPI document based on the authenticated user's permissions.
 */
export const dynamicSpecHandler = async (req: PayloadRequest): Promise<Response> => {
  let user = req.user as {
    id?: string | number
    collection?: string
    role?: string
    status?: string
    email?: string
    permissions?: Array<{ collection: string; methods: string[] }>
    allowedEndpoints?: string[]
  } | null

  // 1. Unauthenticated -> 401 Unauthorized
  if (!user) {
    return Response.json(
      {
        error: 'Unauthorized',
        message: 'API authentication required. Please sign in with your API User credentials to view OpenAPI documentation.',
      },
      { status: 401 }
    )
  }

  // Fetch fresh API user record from DB so changes in Admin Panel apply immediately
  if (user.id && user.collection === 'api-users') {
    try {
      const freshUser = (await req.payload.findByID({
        collection: 'api-users',
        id: String(user.id),
        depth: 0,
      })) as any
      if (freshUser) {
        user = {
          ...user,
          role: freshUser.role ?? user.role,
          status: freshUser.status ?? user.status,
          permissions: freshUser.permissions ?? user.permissions,
          allowedEndpoints: freshUser.allowedEndpoints ?? user.allowedEndpoints,
        }
      }
    } catch {
      // fallback to decoded token
    }
  }

  // 2. Suspended / Inactive User -> 403 Forbidden
  if (user.status === 'inactive') {
    return Response.json(
      {
        error: 'Forbidden',
        message: 'Your API user account is currently inactive.',
      },
      { status: 403 }
    )
  }

  // Retrieve base document
  const baseDoc = await getBaseOpenApiDocument(req)
  const serverUrl = deriveServerUrl(req)

  // 3. Admin: Full Access to all documented endpoints
  const isSuperAdmin = user.collection === 'admin'
  const isApiAdminRole = user.collection === 'api-users' && user.role === 'admin'

  if (isSuperAdmin || isApiAdminRole) {
    const adminDoc = JSON.parse(JSON.stringify(baseDoc))
    adminDoc.servers = [{ url: serverUrl }]
    adminDoc.info = {
      ...adminDoc.info,
      title: 'CardMax API (Administrator View)',
      description: `Full access view for ${user.email ?? 'Admin'}. All collections and CRUD operations enabled.`,
    }
    for (const p of OBSOLETE_AUTH_PATHS) {
      delete adminDoc.paths?.[p]
    }
    return Response.json(adminDoc)
  }

  // 4. Developer: Filter operations by user.permissions
  if (user.collection === 'api-users' && user.role === 'developer') {
    const filteredDoc = JSON.parse(JSON.stringify(baseDoc))
    filteredDoc.servers = [{ url: serverUrl }]
    filteredDoc.info = {
      ...filteredDoc.info,
      title: `CardMax API (Developer View: ${user.email})`,
      description: `Custom documentation filtered to your assigned collection and method permissions.`,
    }

    const collectionSlugs = new Set(
      req.payload.config.collections.map((c) => c.slug.toLowerCase())
    )

    const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete']
    const paths = filteredDoc.paths || {}
    for (const p of OBSOLETE_AUTH_PATHS) {
      delete paths[p]
    }
    const activeTags = new Set<string>()

    for (const [pathKey, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue

      // Normalize path to find collection slug (e.g., /api/banks -> banks, /api/banks/{id} -> banks)
      const cleanPath = pathKey.replace(/^\/api\//, '').replace(/^\//, '')
      const firstSegment = cleanPath.split('/')[0]?.toLowerCase()

      // 1. Check if user has explicit endpoint-level permission
      const userAllowedEndpoints = Array.isArray(user.allowedEndpoints) ? user.allowedEndpoints : []
      const isExplicitlyAllowedEndpoint = userAllowedEndpoints.includes(pathKey)

      // If this path belongs to a collection:
      if (firstSegment && collectionSlugs.has(firstSegment)) {
        for (const method of HTTP_METHODS) {
          if ((pathItem as any)[method]) {
            const operation = HTTP_METHOD_TO_OPERATION[method]
            const allowed =
              isExplicitlyAllowedEndpoint ||
              (operation ? hasApiPermission(req, firstSegment, operation) : false)

            if (!allowed) {
              delete (pathItem as any)[method]
            } else {
              const opTags = (pathItem as any)[method]?.tags
              if (Array.isArray(opTags)) {
                opTags.forEach((t: string) => activeTags.add(t))
              }
            }
          }
        }

        // Check if any HTTP methods remain on this path
        const remainingMethods = Object.keys(pathItem).filter((k) =>
          HTTP_METHODS.includes(k)
        )
        if (remainingMethods.length === 0) {
          delete paths[pathKey]
        }
      } else {
        // Paths not matching a collection (e.g. auth login, openapi-auth)
        // Keep standard auth endpoints so developers can authenticate
        for (const method of HTTP_METHODS) {
          const opTags = (pathItem as any)[method]?.tags
          if (Array.isArray(opTags)) {
            opTags.forEach((t: string) => activeTags.add(t))
          }
        }
      }
    }

    // Ensure tags include all active operations, enriched with metadata and sorted in functional order
    const existingTags = Array.isArray(filteredDoc.tags) ? filteredDoc.tags : []
    const tagMap = new Map<string, any>(existingTags.map((t: any) => [t.name, t]))
    filteredDoc.tags = sortTags(
      Array.from(activeTags).map(
        (tagName) =>
          tagMap.get(tagName) || {
            name: tagName,
            description: TAG_METADATA[tagName]?.description || `${tagName} Endpoints`,
          }
      )
    )

    return Response.json(filteredDoc)
  }

  // 5. Customer app users or others -> 403 Forbidden
  return Response.json(
    {
      error: 'Forbidden',
      message: 'Access restricted to API Users (Administrators and Developers).',
    },
    { status: 403 }
  )
}
