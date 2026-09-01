import { gatekeeperPlugin } from 'payload-gatekeeper'

export const gatekeeperPluginConfig = gatekeeperPlugin({
  collections: {
    admin: {
      enhance: true,
      autoAssignFirstUser: true,
    },
  },
})
