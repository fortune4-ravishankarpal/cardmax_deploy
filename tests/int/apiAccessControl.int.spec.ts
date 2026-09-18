// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  hasApiPermission,
  createApiAccess,
  mapHttpMethodToOperation,
  isApiAdmin,
} from '@/access/apiPermissionEngine'

describe('API Access Control & Permission Engine', () => {
  describe('mapHttpMethodToOperation', () => {
    it('maps standard HTTP methods correctly', () => {
      expect(mapHttpMethodToOperation('GET')).toBe('read')
      expect(mapHttpMethodToOperation('get')).toBe('read')
      expect(mapHttpMethodToOperation('POST')).toBe('create')
      expect(mapHttpMethodToOperation('PUT')).toBe('update')
      expect(mapHttpMethodToOperation('PATCH')).toBe('update')
      expect(mapHttpMethodToOperation('DELETE')).toBe('delete')
      expect(mapHttpMethodToOperation('UNKNOWN')).toBeNull()
    })
  })

  describe('isApiAdmin', () => {
    it('recognizes CMS superadmin', () => {
      expect(isApiAdmin({ collection: 'admin' })).toBe(true)
    })

    it('recognizes API admin user', () => {
      expect(isApiAdmin({ collection: 'api-users', role: 'admin', status: 'active' })).toBe(true)
    })

    it('rejects inactive API admin', () => {
      expect(isApiAdmin({ collection: 'api-users', role: 'admin', status: 'inactive' })).toBe(false)
    })

    it('rejects developer users', () => {
      expect(isApiAdmin({ collection: 'api-users', role: 'developer', status: 'active' })).toBe(false)
    })

    it('rejects customer users', () => {
      expect(isApiAdmin({ collection: 'users' })).toBe(false)
    })

    it('rejects unauthenticated/null', () => {
      expect(isApiAdmin(null)).toBe(false)
    })
  })

  describe('hasApiPermission', () => {
    it('denies unauthenticated requests', () => {
      const mockReq: any = { user: null }
      expect(hasApiPermission(mockReq, 'banks', 'read')).toBe(false)
      expect(hasApiPermission(mockReq, 'banks', 'create')).toBe(false)
    })

    it('allows CMS superadmin on any collection and operation', () => {
      const mockReq: any = { user: { collection: 'admin' } }
      expect(hasApiPermission(mockReq, 'banks', 'read')).toBe(true)
      expect(hasApiPermission(mockReq, 'banks', 'create')).toBe(true)
      expect(hasApiPermission(mockReq, 'banks', 'delete')).toBe(true)
      expect(hasApiPermission(mockReq, 'custom-collection', 'update')).toBe(true)
    })

    it('allows API Admin on any collection and operation', () => {
      const mockReq: any = {
        user: { collection: 'api-users', role: 'admin', status: 'active' },
      }
      expect(hasApiPermission(mockReq, 'banks', 'read')).toBe(true)
      expect(hasApiPermission(mockReq, 'cards', 'create')).toBe(true)
      expect(hasApiPermission(mockReq, 'category-master', 'delete')).toBe(true)
    })

    it('denies inactive API Admin', () => {
      const mockReq: any = {
        user: { collection: 'api-users', role: 'admin', status: 'inactive' },
      }
      expect(hasApiPermission(mockReq, 'banks', 'read')).toBe(false)
    })

    it('enforces explicit permissions for Dev1', () => {
      const dev1Req: any = {
        user: {
          collection: 'api-users',
          role: 'developer',
          status: 'active',
          permissions: [
            { collection: 'banks', methods: ['read'] },
            { collection: 'cards', methods: ['read', 'create'] },
            { collection: 'category-master', methods: ['read'] },
          ],
        },
      }

      // Banks: read only
      expect(hasApiPermission(dev1Req, 'banks', 'read')).toBe(true)
      expect(hasApiPermission(dev1Req, 'banks', 'create')).toBe(false)
      expect(hasApiPermission(dev1Req, 'banks', 'update')).toBe(false)
      expect(hasApiPermission(dev1Req, 'banks', 'delete')).toBe(false)

      // Cards: read and create
      expect(hasApiPermission(dev1Req, 'cards', 'read')).toBe(true)
      expect(hasApiPermission(dev1Req, 'cards', 'create')).toBe(true)
      expect(hasApiPermission(dev1Req, 'cards', 'update')).toBe(false)
      expect(hasApiPermission(dev1Req, 'cards', 'delete')).toBe(false)

      // Merchant Master: unassigned -> DENIED
      expect(hasApiPermission(dev1Req, 'merchant-master', 'read')).toBe(false)
      expect(hasApiPermission(dev1Req, 'merchant-master', 'create')).toBe(false)
    })

    it('enforces explicit permissions for Dev2', () => {
      const dev2Req: any = {
        user: {
          collection: 'api-users',
          role: 'developer',
          status: 'active',
          permissions: [
            { collection: 'banks', methods: ['read'] },
            { collection: 'merchant-master', methods: ['read', 'create'] },
            { collection: 'subscription-plans', methods: ['read'] },
          ],
        },
      }

      // Banks: read
      expect(hasApiPermission(dev2Req, 'banks', 'read')).toBe(true)
      expect(hasApiPermission(dev2Req, 'banks', 'create')).toBe(false)

      // Merchant Master: read and create
      expect(hasApiPermission(dev2Req, 'merchant-master', 'read')).toBe(true)
      expect(hasApiPermission(dev2Req, 'merchant-master', 'create')).toBe(true)
      expect(hasApiPermission(dev2Req, 'merchant-master', 'delete')).toBe(false)

      // Category Master: unassigned -> DENIED
      expect(hasApiPermission(dev2Req, 'category-master', 'read')).toBe(false)

      // Cards: unassigned -> DENIED
      expect(hasApiPermission(dev2Req, 'cards', 'read')).toBe(false)
    })

    it('denies customer mobile users from developer APIs by default', () => {
      const customerReq: any = {
        user: { collection: 'users', id: '123' },
      }
      expect(hasApiPermission(customerReq, 'banks', 'read')).toBe(false)
      expect(hasApiPermission(customerReq, 'banks', 'create')).toBe(false)
    })
  })

  describe('createApiAccess', () => {
    it('constructs complete access configuration for collections', () => {
      const access = createApiAccess('banks')
      expect(access.read).toBeDefined()
      expect(access.create).toBeDefined()
      expect(access.update).toBeDefined()
      expect(access.delete).toBeDefined()
      expect(access.admin).toBeDefined()

      const adminReq: any = { user: { collection: 'admin' } }
      expect(access.read!({ req: adminReq } as any)).toBe(true)
      expect(access.create!({ req: adminReq } as any)).toBe(true)
      expect(access.update!({ req: adminReq } as any)).toBe(true)
      expect(access.delete!({ req: adminReq } as any)).toBe(true)
      expect(access.admin!({ req: adminReq } as any)).toBe(true)
    })
  })
})
