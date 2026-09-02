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
