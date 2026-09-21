import { gatekeeperPlugin } from 'payload-gatekeeper'
import type { Plugin } from 'payload'

const baseGatekeeperPlugin = gatekeeperPlugin({
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
    'category-master',
    'merchant-master',
    'api-users',
    'card-applications',
    'device-tokens',
    'notification-templates',
    'anonymization-requests',
    'anonymized-identities',
    'anonymization-logs',
    'provider-events',
    'roles',
    'admin',
  ],
})

export const gatekeeperPluginConfig: Plugin = async (incomingConfig) => {
  const config = await baseGatekeeperPlugin(incomingConfig)

  // Protect gatekeeper collections so non-admin users (e.g. api-users or users)
  // never trigger gatekeeper's checkPermission with their own string role (like 'developer'),
  // and unauthenticated build probes never attempt req.payload.count().
  const targetSlugs = ['admin', 'roles', 'provider-events']

  for (const slug of targetSlugs) {
    const col = config.collections?.find((c) => c.slug === slug)
    if (col && col.access) {
      const origAccess = { ...col.access }
      const operations = ['read', 'create', 'update', 'delete', 'readVersions', 'unlock'] as const

      for (const op of operations) {
        const origFn = origAccess[op]
        if (origFn && typeof origFn === 'function') {
          ;(col.access as any)[op] = async (args: any) => {
            // Deny immediately if unauthenticated or if the user is not from the CMS 'admin' collection.
            // This prevents gatekeeper from accessing req.payload during build/probes or resolving non-admin roles.
            if (!args.req?.user || args.req.user.collection !== 'admin') {
              return false
            }
            return origFn(args)
          }
        }
      }
    }
  }

  return config
}
