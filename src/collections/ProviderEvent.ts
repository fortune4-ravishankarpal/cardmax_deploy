import { CollectionConfig } from 'payload'

export const ProviderEvent: CollectionConfig = {
  slug: 'provider-events',
  admin: {
    group: 'Subscription & Max Pro',
    useAsTitle: 'providerEventId',
    defaultColumns: ['provider', 'eventType', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    create: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
  },
  fields: [
    {
      name: 'provider',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'providerEventId',
      type: 'text',
      required: true,
    },
    {
      name: 'eventType',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Processed', value: 'processed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Ignored', value: 'ignored' },
      ],
      required: true,
      defaultValue: 'pending',
      index: true,
    },
    {
      name: 'rawPayload',
      type: 'json',
      required: true,
    },
    {
      name: 'errorDetails',
      type: 'textarea',
    },
    {
      name: 'processedAt',
      type: 'date',
    },
    {
      name: 'uniqueConstraint',
      type: 'text',
      unique: true,
      admin: {
        hidden: true, // Used for DB uniqueness constraint: provider + providerEventId
      },
      hooks: {
        beforeValidate: [
          ({ data }) => {
            if (data?.provider && data?.providerEventId) {
              return `${data.provider}_${data.providerEventId}`
            }
          }
        ]
      }
    }
  ],
}
