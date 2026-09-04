import { CollectionConfig } from 'payload'

export const Subscription: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    group: 'Subscription & Max Pro',
    useAsTitle: 'providerSubscriptionId',
    defaultColumns: ['user', 'plan', 'status', 'currentPeriodEnd'],
    description: 'This collection manages a user\'s active or past subscription details (likely integrating with a payment provider like razorpay or stripe).',
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
      admin: {
        description: 'The user who owns this subscription.',
      }
    },
    {
      name: 'plan',
      type: 'relationship',
      relationTo: 'subscription-plans',
      required: true,
      admin: {
        description: 'The specific subscription plan they are subscribed to (links to a SubscriptionPlan collection).',
      }
    },
    {
      name: 'providerSubscriptionId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The unique ID given by the payment provider (e.g., sub_12345 in Stripe). Used to map our database to the provider.',
      }
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
      admin: {
        description: 'The current state of the subscription. trialing, active, past_due, canceled, expired, halted, pending, created, authenticated.',
      }
    },
    {
      name: 'currentPeriodStart',
      type: 'date',
      admin: {
        description: 'The start date of the current billing cycle. (e.g., July 1st to August 1st).',
      }
    },
    {
      name: 'currentPeriodEnd',
      type: 'date',
      admin: {
        description: 'The end date of the current billing cycle. (e.g., July 1st to August 1st).',
      }
    },
    {
      name: 'cancelAtPeriodEnd',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'A boolean (true/false) indicating if the user has requested to cancel their subscription, but it should remain active until the currentPeriodEnd is reached.',
      }
    },
    {
      name: 'canceledAt',
      type: 'date',
      admin: {
        description: 'The exact date/time the user hit the cancel button.',
      }
    },
    {
      name: 'endedAt',
      type: 'date',
      admin: {
        description: 'The exact date/time the subscription completely expired and they lost access.',
      }
    },
    {
      name: 'gracePeriodStartedAt',
      type: 'date',
      admin: {
        description: 'If a payment fails, the subscription might enter a "past due" state where they still get access for a few days to fix their payment method. These dates track when this leniency period starts.',
      }
    },
    {
      name: 'gracePeriodEndsAt',
      type: 'date',
      admin: {
        description: 'These dates track when this leniency period strictly cuts them off.',
      }
    },
    {
      name: 'providerCustomerId',
      type: 'text',
      admin: {
        description: 'The ID of the customer in the payment provider\'s system (e.g., cus_67890 in Stripe).',
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
