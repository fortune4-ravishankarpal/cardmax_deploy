import { checkIsSuperAdmin } from '@/access/isAdmin'
import { contentFreezePlugin } from '@payload-bites/content-freeze'

export const contentFreezeConfig = contentFreezePlugin({
  // optional but recommended for custom access control
  overrideContentFreezeSettingsGlobal: (global) => ({
    ...global,
    admin: {
      ...global.admin,
      group: 'System',
    },
    labels: {
      // ...global.labels,
      singular: 'Content Freezing',
      plural: 'Content Freezing',
    },
    access: {
      ...global.access,
      read: ({ req }) => checkIsSuperAdmin(req.user),
      update: ({ req }) => checkIsSuperAdmin(req.user),
    },
  }),
})
