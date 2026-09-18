import { CollectionConfig } from 'payload'

export const UserCard: CollectionConfig = {
  slug: 'user-cards',
  admin: {
    group: 'Wallets & Users',
    useAsTitle: 'displayName',
    defaultColumns: ['user', 'card', 'status', 'creditLimit', 'createdAt'],
    description: 'This collection links the global database of Credit Cards (the CreditCard collection) to specific users, turning them into "Wallets".',
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
      admin: {
        description: 'The user who owns this specific wallet entry.',
      }
    },
    {
      name: 'card',
      type: 'relationship',
      relationTo: 'CreditCard',
      required: true,
      index: true,
      admin: {
        description: 'A link to the master CreditCard collection (e.g., Chase Sapphire Reserve).',
      }
    },
    {
      name: 'physicalCard',
      type: 'relationship',
      relationTo: 'cards',
      required: false,
      hasMany: false,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Optional link to the securely encrypted physical card vault entry (stores masked PAN, expiry, and encrypted cardholder data).',
      },
      filterOptions: ({ user }) => {
        if (!user) return false
        if (user.collection === 'admin') return true
        return {
          user: {
            equals: user.id,
          },
        }
      },
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
      admin: {
        description: 'Whether the card is currently Active, Deactivated (maybe they lost it), or Closed (canceled the account).',
      }
    },
    {
      name: 'creditLimit',
      type: 'number',
      admin: {
        description: 'The user\'s specific credit limit on this card.',
      }
    },
    {
      name: 'billingCycleDay',
      type: 'number',
      min: 1,
      max: 31,
      admin: {
        description: 'The day of the month their billing cycle usually resets (1-31).',
      }
    },
    {
      name: 'statementDay',
      type: 'number',
      min: 1,
      max: 31,
      admin: {
        description: 'The day of the month their statement is generated.',
      },
    },
    {
      name: 'paymentDueDay',
      type: 'number',
      min: 1,
      max: 31,
      admin: {
        description: 'The day of the month payment is due.',
      },
    },
    {
      name: 'openedAt',
      type: 'date',
      admin: {
        description: 'When the user originally opened this credit card account.',
      },
    },
    {
      name: 'closedAt',
      type: 'date',
      admin: {
        description: 'When the user closed this credit card account.',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ req, data, operation }) => {
        if (data) {
          delete (data as any).createdBy
          delete (data as any).lastModifiedBy
        }
        if (operation === 'create' && req?.user && data) {
          if (req.user.collection !== 'admin' || !data.user) {
            data.user = req.user.id
          }
        }
        return data
      },
    ],
    beforeChange: [
      ({ req, data, operation }) => {
        if (data) {
          delete (data as any).createdBy
          delete (data as any).lastModifiedBy
        }
        if (operation === 'create' && req?.user && data) {
          if (req.user.collection !== 'admin' || !data.user) {
            data.user = req.user.id
          }
        }
        return data
      },
    ],
  },
  endpoints: [
    {
      path: '/catalog',
      method: 'get',
      handler: async (req) => {
        try {
          const cards = await req.payload.find({
            collection: 'CreditCard',
            where: {
              and: [
                {
                  deletedAt: {
                    exists: false,
                  },
                },
                {
                  name: {
                    exists: true,
                  },
                },
              ],
            },
            depth: 1,
            limit: 200,
          })

          return Response.json(cards.docs)
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : 'Internal Server Error'
          return Response.json({ error: message }, { status: 500 })
        }
      },
    },
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
              equals: req.user.id,
            },
          },
          depth: 2,
        })

        return Response.json(cards.docs)
      },
    },
    {
      path: '/:id/deactivate',
      method: 'post',
      handler: async (req) => {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const pathSegments = (req.url || '').split('?')[0].split('/')
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
