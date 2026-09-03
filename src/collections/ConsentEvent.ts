import { CollectionConfig } from 'payload'

export const ConsentEvent: CollectionConfig = {
  slug: 'consent-events',
  timestamps: true,
  admin: {
    group: 'Privacy & Settings',
    useAsTitle: 'action',
    defaultColumns: ['user', 'purpose', 'action', 'version', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => {
        if (!user) return false;
        if (user.collection === 'admin') return true;
        return {
            user: {
                equals: user.id
            }
        };
    },
    create: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'purpose',
      type: 'text', // e.g. 'analyse_inbox', 'persist_derived', 'improve_merchants'
      required: true,
      index: true,
    },
    {
      name: 'action',
      type: 'select',
      options: [
        { label: 'Grant', value: 'grant' },
        { label: 'Revoke', value: 'revoke' },
        { label: 'Notify', value: 'notify' }, // E.g., reminding them they granted it 6 months ago
      ],
      required: true,
    },
    {
      name: 'version',
      type: 'text',
      required: true,
      admin: {
        description: 'The semantic version of the consent terms at the time of this event',
      }
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'Where this event originated (e.g. "web_onboarding", "settings_page", "api")',
      }
    },
    {
      name: 'ipAddress',
      type: 'text',
    },
    {
      name: 'userAgent',
      type: 'text',
    }
  ],
}
