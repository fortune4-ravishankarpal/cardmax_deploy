import { CollectionConfig } from 'payload'

export const FeatureFlag: CollectionConfig = {
  slug: 'feature-flags',
  admin: {
    group: 'Privacy & Settings',
    useAsTitle: 'name',
    defaultColumns: ['name', 'key', 'enabled', 'updatedAt'],
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
    },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Unique identifier used in code (e.g. max_pro_active)',
      }
    },
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this feature is globally enabled',
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
}
