import { CollectionConfig } from 'payload'

export const FeatureFlag: CollectionConfig = {
  slug: 'feature-flags',
  admin: {
    group: 'Privacy & Settings',
    useAsTitle: 'name',
    defaultColumns: ['name', 'key', 'enabled', 'updatedAt'],
    description: 'Feature flags allow you to turn parts of the app on or off instantly without deploying new code.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user), // Restrict as needed based on RBAC
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'A human-readable name (e.g., "Max Pro Trial Enabled").',
      }
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The unique variable name used in the codebase to check if the feature is on (e.g., max_pro_active).',
      }
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'A checkbox. If true, the feature is visible/active globally. If false, it\'s hidden.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Notes for the admin team about what this flag actually does.',
      }
    },
  ],
}
