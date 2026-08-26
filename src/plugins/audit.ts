import { checkIsAdminOrUserAdmin } from '@/access/isAdmin'
import { auditFieldsPlugin } from '@payload-bites/audit-fields'
import { Plugin } from 'payload'

export const auditFieldsConfig: Plugin = (incomingConfig) => {
  // Call the original plugin
  const configWithAudit = auditFieldsPlugin({})(incomingConfig)

  // Inject access control into the audit fields for collections
  if (configWithAudit.collections) {
    configWithAudit.collections = configWithAudit.collections.map((collection) => ({
      ...collection,
      fields: collection.fields.map((field) => {
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

  // Inject access control into the audit fields for globals
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

  return configWithAudit
}
