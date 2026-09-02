import { CollectionConfig } from 'payload'

export const Notification: CollectionConfig = {
  slug: 'notifications',
  admin: {
    group: 'Engagement & Analytics',
    useAsTitle: 'title',
    defaultColumns: ['user', 'type', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
        if (!user) return false;
        if (user.collection === 'admin') return true;
        return {
            user: {
                equals: user.id
            }
        };
    },
    // Managed internally
    create: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
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
      name: 'type',
      type: 'select',
      options: [
        { label: 'System', value: 'system' },
        { label: 'Payment', value: 'payment' },
        { label: 'Subscription', value: 'subscription' },
        { label: 'Alert', value: 'alert' },
      ],
      required: true,
      index: true,
    },
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
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Failed', value: 'failed' },
      ],
      required: true,
      defaultValue: 'pending',
    },
    {
      name: 'readAt',
      type: 'date',
    },
    {
      name: 'metadata',
      type: 'json',
    }
  ],
  endpoints: [
    {
      path: '/me',
      method: 'get',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const notifications = await req.payload.find({
          collection: 'notifications',
          where: {
            user: {
              equals: req.user.id
            }
          },
          sort: '-createdAt'
        })

        return Response.json(notifications.docs)
      }
    },
    {
      path: '/:id/read',
      method: 'post',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const pathSegments = req.url.split('?')[0].split('/')
        const id = pathSegments[pathSegments.length - 2]

        try {
          const notification = await req.payload.findByID({
            collection: 'notifications',
            id,
          })

          if (!notification || (notification.user as any) !== req.user.id) {
             return Response.json({ error: 'Not found' }, { status: 404 })
          }

          const updated = await req.payload.update({
            collection: 'notifications',
            id,
            data: {
              readAt: new Date().toISOString()
            }
          })

          return Response.json({ success: true, notification: updated })
        } catch(e) {
          return Response.json({ error: 'Internal Server Error' }, { status: 500 })
        }
      }
    }
  ]
}
