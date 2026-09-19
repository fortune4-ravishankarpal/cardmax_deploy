import type { CollectionConfig } from 'payload'

/**
 * DeviceTokens collection
 *
 * Stores FCM / APNs device tokens per user.
 * Raw tokens NEVER appear inside the Notification collection.
 * Failed / unregistered tokens are automatically set to isActive = false.
 *
 * Custom endpoints:
 *   POST /api/device-tokens/register
 *   POST /api/device-tokens/unregister
 */
export const DeviceTokens: CollectionConfig = {
  slug: 'device-tokens',
  labels: { singular: 'Device Token', plural: 'Device Tokens' },
  admin: {
    group: 'Engagement & Analytics',
    useAsTitle: 'token',
    defaultColumns: ['user', 'platform', 'provider', 'environment', 'isActive', 'lastUsedAt'],
  },
  access: {
    // Users can only read their own tokens; admins see all
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'admin') return true
      return { user: { equals: user.id } }
    },
    // Tokens can only be created via the /register API endpoint (not manually from Admin UI)
    create: () => false,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'admin') return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'admin') return true
      return { user: { equals: user.id } }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'token',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'platform',
      type: 'select',
      options: [
        { label: 'Android', value: 'android' },
        { label: 'iOS', value: 'ios' },
        { label: 'Web', value: 'web' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'provider',
      type: 'select',
      options: [
        { label: 'FCM', value: 'fcm' },
        { label: 'APNs', value: 'apns' },
      ],
      required: true,
    },
    {
      name: 'environment',
      type: 'select',
      options: [
        { label: 'Development', value: 'development' },
        { label: 'Staging', value: 'staging' },
        { label: 'Production', value: 'production' },
      ],
      required: true,
      defaultValue: 'development',
      index: true,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      index: true,
    },
    {
      name: 'lastUsedAt',
      type: 'date',
    },
  ],
  endpoints: [
    {
      path: '/register',
      method: 'post',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const body = req.json ? await req.json() : (req as any).body
          const { token, platform, provider, environment } = body

          if (!token || !platform || !provider) {
            return Response.json({ error: 'Missing required fields: token, platform, provider' }, { status: 400 })
          }

          // Upsert: deactivate any existing record for this token, then create a fresh active one
          const existing = await req.payload.find({
            collection: 'device-tokens',
            where: { token: { equals: token } },
            limit: 1,
            overrideAccess: true,
          })

          if (existing.docs.length > 0) {
            await req.payload.update({
              collection: 'device-tokens',
              id: existing.docs[0].id,
              data: {
                user: req.user.id,
                platform,
                provider,
                environment: environment || 'development',
                isActive: true,
                lastUsedAt: new Date().toISOString(),
              },
              overrideAccess: true,
            })
            return Response.json({ success: true, id: existing.docs[0].id })
          }

          const record = await req.payload.create({
            collection: 'device-tokens',
            data: {
              user: req.user.id,
              token,
              platform,
              provider,
              environment: environment || 'development',
              isActive: true,
              lastUsedAt: new Date().toISOString(),
            },
            overrideAccess: true,
          })
          return Response.json({ success: true, id: record.id })
        } catch (e: any) {
          req.payload.logger.error({ err: e }, 'Failed to register device token')
          return Response.json({ error: 'Internal Server Error' }, { status: 500 })
        }
      },
    },
    {
      path: '/unregister',
      method: 'post',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          const body = req.json ? await req.json() : (req as any).body
          const { token } = body

          if (!token) {
            return Response.json({ error: 'Missing required field: token' }, { status: 400 })
          }

          const existing = await req.payload.find({
            collection: 'device-tokens',
            where: {
              and: [
                { token: { equals: token } },
                { user: { equals: req.user.id } },
              ],
            },
            limit: 1,
            overrideAccess: true,
          })

          if (existing.docs.length > 0) {
            await req.payload.update({
              collection: 'device-tokens',
              id: existing.docs[0].id,
              data: { isActive: false },
              overrideAccess: true,
            })
          }

          return Response.json({ success: true })
        } catch (e: any) {
          req.payload.logger.error({ err: e }, 'Failed to unregister device token')
          return Response.json({ error: 'Internal Server Error' }, { status: 500 })
        }
      },
    },
  ],
}
