import { CollectionConfig } from 'payload'

export const AnalyticsEvent: CollectionConfig = {
  slug: 'analytics-events',
  admin: {
    group: 'Engagement & Analytics',
    useAsTitle: 'event',
    defaultColumns: ['event', 'user', 'category', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    create: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'admin'), // Immutable
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        description: 'User if authenticated at the time of the event',
      }
    },
    {
      name: 'anonymousId',
      type: 'text',
      index: true,
      admin: {
        description: 'Session or device ID for unauthenticated events',
      }
    },
    {
      name: 'event',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'The event name (e.g. "page_view", "subscription_started")',
      }
    },
    {
      name: 'category',
      type: 'text',
      index: true,
      admin: {
        description: 'Broad categorization (e.g. "engagement", "monetization")',
      }
    },
    {
      name: 'properties',
      type: 'json',
      admin: {
        description: 'Event specific properties',
      }
    },
    {
      name: 'url',
      type: 'text',
    },
    {
      name: 'userAgent',
      type: 'text',
    },
    {
      name: 'ipAddress',
      type: 'text',
    }
  ],
}
