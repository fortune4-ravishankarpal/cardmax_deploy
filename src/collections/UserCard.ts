import { CollectionConfig } from 'payload'

export const UserCard: CollectionConfig = {
  slug: 'user-cards',
  admin: {
    group: 'Wallets & Users',
    useAsTitle: 'displayName',
    defaultColumns: ['user', 'card', 'status', 'creditLimit', 'createdAt'],
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
    create: ({ req: { user } }) => Boolean(user), // Authenticated users can create
    update: ({ req: { user } }) => {
        if (!user) return false;
        if (user.collection === 'admin') return true;
        return {
            user: {
                equals: user.id
            }
        };
    },
    delete: ({ req: { user } }) => {
        if (!user) return false;
        if (user.collection === 'admin') return true;
        return {
            user: {
                equals: user.id
            }
        };
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
      name: 'card',
      type: 'relationship',
      relationTo: 'CreditCard',
      required: true,
      index: true,
    },
    {
      name: 'displayName',
      type: 'text',
      admin: {
        description: 'Optional custom name for the card (e.g. "My Travel Card")',
      }
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Deactivated', value: 'deactivated' },
        { label: 'Closed', value: 'closed' },
      ],
      required: true,
      defaultValue: 'active',
      index: true,
    },
    {
      name: 'creditLimit',
      type: 'number',
    },
    {
      name: 'billingCycleDay',
      type: 'number',
      min: 1,
      max: 31,
    },
    {
      name: 'statementDay',
      type: 'number',
      min: 1,
      max: 31,
    },
    {
      name: 'openedAt',
      type: 'date',
    },
    {
      name: 'closedAt',
      type: 'date',
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

        const cards = await req.payload.find({
          collection: 'user-cards',
          where: {
            user: {
              equals: req.user.id
            }
          }
        })

        return Response.json(cards.docs)
      }
    },
    {
      path: '/:id/deactivate',
      method: 'post',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const pathSegments = req.url.split('?')[0].split('/')
        const id = pathSegments[pathSegments.length - 2] // The :id from /:id/deactivate

        try {
          // Check ownership
          const card = await req.payload.findByID({
            collection: 'user-cards',
            id,
          })

          if (!card || (card.user as any) !== req.user.id) { // Depending on depth, card.user could be an object, but checking ID is safer
             // A proper check would ensure we don't leak existence, just returning 404
             return Response.json({ error: 'Not found' }, { status: 404 })
          }

          const updated = await req.payload.update({
            collection: 'user-cards',
            id,
            data: {
              status: 'deactivated'
            }
          })

          return Response.json({ success: true, card: updated })
        } catch(e) {
          return Response.json({ error: 'Internal Server Error' }, { status: 500 })
        }
      }
    }
  ]
}
