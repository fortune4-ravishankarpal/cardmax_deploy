import { gatekeeperPlugin } from 'payload-gatekeeper'

export const gatekeeperPluginConfig = gatekeeperPlugin({
  collections: {
    admin: {
      enhance: true,
      autoAssignFirstUser: true,
    },
  },
  // The card vault collections enforce their own strict owner/role-based
  // access control (see src/cards/access.ts). Gatekeeper's permission wrapper
  // resolves permissions from the Admin roles system only, so plain
  // `users`-collection owners would be denied before their own access rules
  // ever run — breaking list/read of their own cards.
  excludeCollections: ['cards', 'card_audit_logs'],

})

