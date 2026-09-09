import { gatekeeperPlugin } from 'payload-gatekeeper'

export const gatekeeperPluginConfig = gatekeeperPlugin({
  collections: {
    admin: {
      enhance: true,
      autoAssignFirstUser: true,
    },
  },
  excludeCollections: [
    'users',
    'CreditCard',
    'banks',
    'user-cards',
    'cards',
    'statements',
    'consents',
    'consent-events',
    'subscriptions',
    'subscription-plans',
    'subscription-payments',
    'subscription-events',
    'trial-eligibility',
    'notifications',
    'analytics-events',
    'max-pro-events',
    'user-goals',
    'feature-flags',
    'otp',
    'gmail-connections',
    'media',
    'card-audit-logs',
  ],
})
