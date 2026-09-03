import { CollectionConfig } from 'payload'

export const Consent: CollectionConfig = {
  slug: 'consents',
  timestamps: true,
  admin: {
    group: 'Privacy & Settings',
    useAsTitle: 'purpose',
    defaultColumns: ['user', 'purpose', 'status', 'version', 'source', 'grantedAt'],
  },
  access: {
    read: ({ req: { user } }) => {
        if (!user) return false;
        // Admins can read all, users can read their own
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
      type: 'select',
      options: [
        { label: 'Purpose A (Analyse Inbox)', value: 'analyse_inbox' },
        { label: 'Purpose B (Persist Derived Data)', value: 'persist_derived' },
        { label: 'Purpose C (Improve Merchant DB)', value: 'improve_merchants' },
      ],
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Granted', value: 'granted' },
        { label: 'Revoked', value: 'revoked' },
      ],
      required: true,
      defaultValue: 'revoked',
    },
    {
      name: 'version',
      type: 'text',
      required: true,
      admin: {
        description: 'The semantic version of the consent terms the user agreed to (e.g. 1.0.0)',
      }
    },
    {
      name: 'grantedAt',
      type: 'date',
    },
    {
      name: 'revokedAt',
      type: 'date',
    },
    {
      name: 'lastNotifiedAt',
      type: 'date',
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'Where this consent record was created or last updated. E.g. "gmail_connect_flow", "settings_page", "legacy_migration", "api".',
      },
    },
  ],
  endpoints: [
    {
        path: '/me',
        method: 'get',
        handler: async (req) => {
            if (!req.user || req.user.collection !== 'users') {
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }

            const consents = await req.payload.find({
                collection: 'consents',
                where: {
                    user: {
                        equals: req.user.id
                    }
                }
            });

            return Response.json(consents.docs);
        }
    }
  ]
}
