import { CollectionConfig } from 'payload'

export const Subscription: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    group: 'Subscription & Max Pro',
    useAsTitle: 'providerSubscriptionId',
    defaultColumns: ['user', 'plan', 'status', 'currentPeriodEnd'],
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
    // Application manages this, not admins/users directly
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
      name: 'plan',
      type: 'relationship',
      relationTo: 'subscription-plans',
      required: true,
    },
    {
      name: 'providerSubscriptionId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Trialing', value: 'trialing' },
        { label: 'Active', value: 'active' },
        { label: 'Past Due', value: 'past_due' }, // Grace period
        { label: 'Canceled', value: 'canceled' }, // Still active until period ends
        { label: 'Expired', value: 'expired' },
        { label: 'Halted', value: 'halted' },
        { label: 'Pending', value: 'pending' },
        { label: 'Created', value: 'created' },
        { label: 'Authenticated', value: 'authenticated' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'currentPeriodStart',
      type: 'date',
    },
    {
      name: 'currentPeriodEnd',
      type: 'date',
    },
    {
      name: 'cancelAtPeriodEnd',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'canceledAt',
      type: 'date',
    },
    {
      name: 'endedAt',
      type: 'date',
    },
    {
      name: 'gracePeriodStartedAt',
      type: 'date',
    },
    {
      name: 'gracePeriodEndsAt',
      type: 'date',
    },
    {
      name: 'providerCustomerId',
      type: 'text',
      admin: {
        description: 'Customer ID returned from the provider',
      }
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

            const subscriptions = await req.payload.find({
                collection: 'subscriptions',
                where: {
                    user: {
                        equals: req.user.id
                    }
                },
                sort: '-createdAt'
            })

            return Response.json(subscriptions.docs)
        }
    },
    {
        path: '/checkout',
        method: 'post',
        handler: async (req) => {
            if (!req.user || req.user.collection !== 'users') {
                return Response.json({ error: 'Unauthorized' }, { status: 401 })
            }

            try {
                // Use dynamic import to avoid circular dependencies
                const { SubscriptionService } = await import('../subscriptions/service')
                
                const body = req.json ? await req.json() : (req as any).body
                const { planId } = body

                if (!planId) {
                    return Response.json({ error: 'Missing planId' }, { status: 400 })
                }

                const result = await SubscriptionService.createCheckout(req.user.id as string, planId)
                
                return Response.json({ success: true, ...result })
            } catch (error: any) {
                return Response.json({ error: error.message || 'Failed to create checkout' }, { status: 400 })
            }
        }
    },
    {
        path: '/cancel',
        method: 'post',
        handler: async (req) => {
            if (!req.user || req.user.collection !== 'users') {
                return Response.json({ error: 'Unauthorized' }, { status: 401 })
            }

            try {
                // Use dynamic import to avoid circular dependencies
                const { SubscriptionService } = await import('../subscriptions/service')
                
                const body = req.json ? await req.json() : (req as any).body
                const { subscriptionId } = body

                if (!subscriptionId) {
                    return Response.json({ error: 'Missing subscriptionId' }, { status: 400 })
                }

                const result = await SubscriptionService.cancelSubscription(req.user.id as string, subscriptionId)
                
                return Response.json({ success: true, subscription: result })
            } catch (error: any) {
                return Response.json({ error: error.message || 'Failed to cancel subscription' }, { status: 400 })
            }
        }
    }
  ]
}
