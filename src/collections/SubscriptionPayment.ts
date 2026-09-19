import { CollectionConfig } from 'payload'

export const SubscriptionPayment: CollectionConfig = {
  slug: 'subscription-payments',
  admin: {
    group: 'Subscription & Max Pro',
    useAsTitle: 'providerPaymentId',
    defaultColumns: ['subscription', 'amount', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    create: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation === 'create') return
        if ((req.context as any)?.skipNotificationHook) return

        const isCapture = previousDoc?.status !== 'captured' && doc.status === 'captured'
        const isFailed = previousDoc?.status !== 'failed' && doc.status === 'failed'

        if (!isCapture && !isFailed) return

        try {
          // Resolve the user via the subscription relationship
          const subscription = typeof doc.subscription === 'string'
            ? await req.payload.findByID({ collection: 'subscriptions', id: doc.subscription, depth: 0, overrideAccess: true })
            : doc.subscription as any

          const userId = typeof subscription?.user === 'string'
            ? subscription.user
            : (subscription?.user as any)?.id

          if (!userId) return

          const eventType = isCapture ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED'
          const { NotificationService } = await import('../notifications/service')
          await NotificationService.publishEvent(
            {
              eventId: `${eventType}_${doc.id}_${Date.now()}`,
              eventType,
              userId,
              data: {
                paymentId: doc.id,
                currency: doc.currency,
                status: doc.status,
              },
            },
            req.payload,
          )
        } catch (e) {
          req.payload.logger.error({ err: e }, 'Failed to publish payment notification')
        }
      },
    ],
  },
  fields: [
    {
      name: 'subscription',
      type: 'relationship',
      relationTo: 'subscriptions',
      required: true,
      index: true,
    },
    {
      name: 'providerPaymentId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      defaultValue: 'INR',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Authorized', value: 'authorized' },
        { label: 'Captured', value: 'captured' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'rawEvent',
      type: 'json',
      admin: {
        description: 'The raw webhook payload from the provider for this payment',
      }
    }
  ],
}
