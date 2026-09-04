import { CollectionConfig } from 'payload'

export const AnalyticsEvent: CollectionConfig = {
  slug: 'analytics-events',
  admin: {
    group: 'Engagement & Analytics',
    useAsTitle: 'event',
    defaultColumns: ['event', 'user', 'category', 'createdAt'],
    description: 'This collection tracks user behavior and engagement across the app, similar to Mixpanel or Google Analytics but stored directly in your DB.',
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
        description: 'The logged-in user who triggered the event (if they are logged in).',
      }
    },
    {
      name: 'anonymousId',
      type: 'text',
      index: true,
      admin: {
        description: 'A session or device ID for tracking users before they log in or create an account.',
      }
    },
    {
      name: 'event',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'The specific action taken (e.g., "page_view", "subscription_started", "button_clicked").',
      }
    },
    {
      name: 'category',
      type: 'text',
      index: true,
      admin: {
        description: 'A grouping for the event to make querying easier (e.g., "engagement", "monetization", "onboarding").',
      }
    },
    {
      name: 'properties',
      type: 'json',
      admin: {
        description: 'A flexible JSON object containing extra details about the event. (e.g., If the event was "button_clicked", the properties might be {"buttonName": "Upgrade Now", "screen": "Home"}).',
      }
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'The page or screen the user was on when the event happened.',
      }
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'Technical details about the user\'s browser/device (e.g., iPhone Safari, Windows Chrome).',
      }
    },
    {
      name: 'ipAddress',
      type: 'text',
      admin: {
        description: 'The IP address of the user.',
      }
    }
  ],
}
