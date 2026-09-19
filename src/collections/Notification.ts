import { CollectionConfig } from 'payload'

/**
 * Notification collection — enhanced for 8.18 & 8.19.
 *
 * Serves as both the In-App Inbox (channel = in_app) and the multi-channel
 * delivery log (push_fcm, push_apns, email). Every event generates one record
 * per channel, all sharing the same notificationGroupId.
 *
 * Idempotency:
 *   The (eventId, channel) pair is unique. Before creating a new delivery
 *   record, NotificationService checks whether this pair already exists.
 *
 * Raw device tokens are NEVER stored here; see DeviceTokens collection.
 */
export const Notification: CollectionConfig = {
  slug: 'notifications',
  admin: {
    group: 'Engagement & Analytics',
    useAsTitle: 'title',
    defaultColumns: ['user', 'channel', 'type', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'admin') return true
      return { user: { equals: user.id } }
    },
    // System creates records via overrideAccess; admin can manually create
    create: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    // Users can update their own notifications (for marking read)
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
    // ── Idempotency & Grouping ────────────────────────────────────────────
    {
      name: 'eventId',
      type: 'text',
      index: true,
      admin: {
        description: 'Idempotency key: {eventType}_{relatedId}_{timestamp}. Combined with channel to prevent duplicates.',
        position: 'sidebar',
      },
    },
    {
      name: 'notificationGroupId',
      type: 'text',
      index: true,
      admin: {
        description: 'Groups all channel delivery records for a single event occurrence.',
        position: 'sidebar',
      },
    },
    // ── Channel & Type ────────────────────────────────────────────────────
    {
      name: 'channel',
      type: 'select',
      options: [
        { label: 'In-App', value: 'in_app' },
        { label: 'Push (FCM)', value: 'push_fcm' },
        { label: 'Push (APNs)', value: 'push_apns' },
        { label: 'Email', value: 'email' },
      ],
      defaultValue: 'in_app',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'System', value: 'system' },
        { label: 'Payment', value: 'payment' },
        { label: 'Subscription', value: 'subscription' },
        { label: 'Alert', value: 'alert' },
        { label: 'Statement', value: 'statement' },
        { label: 'Application', value: 'application' },
        { label: 'Goal', value: 'goal' },
        { label: 'Onboarding', value: 'onboarding' },
      ],
      required: true,
      index: true,
    },
    // ── Content ───────────────────────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
    },
    {
      name: 'actionUrl',
      type: 'text',
    },
    // ── Template Reference ────────────────────────────────────────────────
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'notification-templates',
      admin: {
        position: 'sidebar',
        description: 'Template used to render this notification (if any).',
      },
    },
    // ── Status & Timestamps ───────────────────────────────────────────────
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Sent', value: 'sent' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Failed', value: 'failed' },
        { label: 'Read', value: 'read' },
      ],
      required: true,
      defaultValue: 'pending',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'deliveredAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'readAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'scheduledFor',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'If set, the notification is queued for future delivery.',
      },
    },
    // ── Metadata & Error ──────────────────────────────────────────────────
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Delivery metadata. In simulation mode: { mode: "simulation" }.',
      },
    },
    {
      name: 'error',
      type: 'json',
      admin: {
        position: 'sidebar',
        description: 'Error details if delivery failed.',
      },
    },
  ],
  endpoints: [
    // GET /api/notifications/me — paginated inbox for current user
    {
      path: '/me',
      method: 'get',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(req.url || '', 'http://localhost')
        const unreadOnly = url.searchParams.get('unread') === 'true'
        const page = parseInt(url.searchParams.get('page') || '1', 10)
        const limit = parseInt(url.searchParams.get('limit') || '20', 10)
        const type = url.searchParams.get('type') || undefined

        const where: Record<string, any> = {
          and: [
            { user: { equals: req.user.id } },
            { channel: { equals: 'in_app' } },
          ],
        }

        if (unreadOnly) {
          where.and.push({ status: { not_equals: 'read' } })
        }
        if (type) {
          where.and.push({ type: { equals: type } })
        }

        const notifications = await req.payload.find({
          collection: 'notifications',
          where,
          sort: '-createdAt',
          page,
          limit,
        })

        return Response.json(notifications)
      },
    },
    // GET /api/notifications/unread-count
    {
      path: '/unread-count',
      method: 'get',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const result = await req.payload.count({
          collection: 'notifications',
          where: {
            and: [
              { user: { equals: req.user.id } },
              { channel: { equals: 'in_app' } },
              { status: { not_equals: 'read' } },
            ],
          },
        })

        return Response.json({ count: result.totalDocs })
      },
    },
    // POST /api/notifications/:id/read
    {
      path: '/:id/read',
      method: 'post',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const pathSegments = (req.url || '').split('?')[0].split('/')
        const id = pathSegments[pathSegments.length - 2]

        try {
          const notification = await req.payload.findByID({
            collection: 'notifications',
            id,
            depth: 0,
          })

          const ownerId = typeof notification.user === 'string'
            ? notification.user
            : (notification.user as any)?.id

          if (!notification || ownerId !== req.user.id) {
            return Response.json({ error: 'Not found' }, { status: 404 })
          }

          const updated = await req.payload.update({
            collection: 'notifications',
            id,
            data: {
              status: 'read',
              readAt: new Date().toISOString(),
            },
          })

          return Response.json({ success: true, notification: updated })
        } catch (e) {
          return Response.json({ error: 'Internal Server Error' }, { status: 500 })
        }
      },
    },
    // POST /api/notifications/read-all
    {
      path: '/read-all',
      method: 'post',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
          await req.payload.update({
            collection: 'notifications',
            where: {
              and: [
                { user: { equals: req.user.id } },
                { channel: { equals: 'in_app' } },
                { status: { not_equals: 'read' } },
              ],
            },
            data: {
              status: 'read',
              readAt: new Date().toISOString(),
            },
          })

          return Response.json({ success: true })
        } catch (e) {
          return Response.json({ error: 'Internal Server Error' }, { status: 500 })
        }
      },
    },
    // DELETE /api/notifications/:id
    {
      path: '/:id',
      method: 'delete',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const pathSegments = (req.url || '').split('?')[0].split('/')
        const id = pathSegments[pathSegments.length - 1]

        try {
          const notification = await req.payload.findByID({
            collection: 'notifications',
            id,
            depth: 0,
          })

          const ownerId = typeof notification.user === 'string'
            ? notification.user
            : (notification.user as any)?.id

          if (!notification || ownerId !== req.user.id) {
            return Response.json({ error: 'Not found' }, { status: 404 })
          }

          await req.payload.delete({
            collection: 'notifications',
            id,
          })

          return Response.json({ success: true })
        } catch (e) {
          return Response.json({ error: 'Internal Server Error' }, { status: 500 })
        }
      },
    },
    // GET /api/notifications/email-domain-health
    {
      path: '/email-domain-health',
      method: 'get',
      handler: async (req) => {
        // Admin only
        if (!req.user || req.user.collection !== 'admin') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const { getDomainHealthReport } = await import('../notifications/email/domainConfig')
          const report = getDomainHealthReport()
          return Response.json(report)
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 500 })
        }
      },
    },
    // POST /api/notifications/test-email
    {
      path: '/test-email',
      method: 'post',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'admin') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        try {
          const body = req.json ? await req.json() : (req as any).body
          const to = body?.to || (req.user as any).email
          const { EmailService } = await import('../notifications/email/service')
          const result = await EmailService.send({
            to,
            subject: 'CardMax Test Email from Admin',
            html: '<p>This is a test email sent from the CardMax Admin panel to verify email deliverability.</p>',
            isSimulation: body?.isSimulation,
          })
          return Response.json(result)
        } catch (e: any) {
          return Response.json({ error: e.message }, { status: 500 })
        }
      },
    },
  ],
}
