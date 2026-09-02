import { CollectionConfig } from 'payload'

export const SubscriptionEvent: CollectionConfig = {
  slug: 'subscription-events',
  admin: {
    group: 'Subscription & Max Pro',
    useAsTitle: 'eventType',
    defaultColumns: ['subscription', 'eventType', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
        if (!user) return false;
        if (user.collection === 'admin') return true;
        // Optionally allow users to see their own events
        return false; 
    },
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
      name: 'eventType',
      type: 'select',
      options: [
        { label: 'Created', value: 'created' },
        { label: 'Activated', value: 'activated' },
        { label: 'Renewed', value: 'renewed' },
        { label: 'Grace Period Started', value: 'grace_period_started' },
        { label: 'Grace Period Ended', value: 'grace_period_ended' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Expired', value: 'expired' },
        { label: 'Halted', value: 'halted' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'notes',
      type: 'textarea',
    },
    {
      name: 'providerEventId',
      type: 'text',
      admin: {
        description: 'Optional reference back to the provider event that triggered this',
      }
    }
  ],
}
