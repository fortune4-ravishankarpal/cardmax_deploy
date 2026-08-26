// payload.config.ts
import { gatekeeperPlugin } from 'payload-gatekeeper'

export const gatekeeperPluginConfig = gatekeeperPlugin({
  // Minimal config - just enhance your admin collection
  collections: {
    users: {
      enhance: true,
      autoAssignFirstUser: true,
    },
  }, 
})
  