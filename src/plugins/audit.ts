import { checkIsAdminOrUserAdmin } from '@/access/isAdmin'
import { auditFieldsPlugin } from '@payload-bites/audit-fields'
import { Plugin } from 'payload'

const excludedCollections: any[] = [
  'user-cards',
  'users',
  'cards',
  'consents',
  'consent-events',
  'gmail-connections',
  'statements',
  'subscriptions',
  'subscription-payments',
  'subscription-events',
  'trial-eligibility',
  'notifications',
  'analytics-events',
  'max-pro-events',
  'user-goals',
  'otp',
  'card-audit-logs',
]

export const auditFieldsConfig: Plugin = (incomingConfig) => {
  // Call the original plugin with excluded collections
  const configWithAudit = auditFieldsPlugin({
    excludedCollections,
  })(incomingConfig)

  // Inject access control into the audit fields for collections
  if (configWithAudit.collections) {
    configWithAudit.collections = configWithAudit.collections.map((collection) => {
      // Safeguard beforeChange hooks so regular users never get admin createdBy
      if (collection.hooks?.beforeChange) {
        collection.hooks.beforeChange = collection.hooks.beforeChange.map((hook: any) => {
          return async (args: any) => {
            const res = await hook(args)
            if (args.req?.user && args.req.user.collection !== 'admin') {
              if (args.data?.createdBy?.relationTo === 'admin') {
                delete args.data.createdBy
              }
              if (args.data?.lastModifiedBy?.relationTo === 'admin') {
                delete args.data.lastModifiedBy
              }
            }
            return res
          }
        })
      }

      const fields = collection.fields.map((field: any) => {
        if ('name' in field && (field.name === 'createdBy' || field.name === 'lastModifiedBy') && 'access' in field) {
          const existingAccess = field.access ?? {}

          return {
            ...field,
            access: {
              ...existingAccess,
              read: ({ req }: any) =>
                checkIsAdminOrUserAdmin(req.user?.collection === 'admin' ? req.user : null),
            },
          }
        }
        return field
      })

      return {
        ...collection,
        fields: fields as any,
      } as any
    }) as any
  }

  /* Inject access control into the audit fields for globals
  if (configWithAudit.globals) {
    configWithAudit.globals = configWithAudit.globals.map((global) => ({
      ...global,
      fields: global.fields.map((field) => {
        if ('name' in field && (field.name === 'createdBy' || field.name === 'lastModifiedBy')) {
          return {
            ...field,
            access: {
              ...field.access,
              read: ({ req }) => checkIsAdminOrUserAdmin(req.user || null),
            },
          }
        }
        return field
      }),
    }))
  }
  */
  return configWithAudit
}
