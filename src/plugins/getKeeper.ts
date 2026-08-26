// payload.config.ts
import { gatekeeperPlugin } from 'payload-gatekeeper'

export const gatekeeperPluginConfig = gatekeeperPlugin({
  collections: {
    // Frontend (OTP/Google) users get a role field, but no auto-assignment.
    // users: {
    //   enhance: true,
    // },
    // Admin panel users: enhance + auto-assign super_admin to the first user.
    admin: {
      enhance: true,
      autoAssignFirstUser: true,
    },
  },
})
  