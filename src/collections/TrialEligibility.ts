import { CollectionConfig } from 'payload'

export const TrialEligibility: CollectionConfig = {
  slug: 'trial-eligibility',
  admin: {
    group: 'Subscription & Max Pro',
    useAsTitle: 'user',
    defaultColumns: ['user', 'trialUsed', 'trialUsedAt'],
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
    // Application manages this, not admins/users directly
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
      unique: true, // One record per user
      index: true,
    },
    {
      name: 'trialUsed',
      type: 'checkbox',
      defaultValue: false,
      required: true,
      index: true,
      admin: {
        description: 'Whether the user has ever used their lifetime trial',
      }
    },
    {
      name: 'trialUsedAt',
      type: 'date',
    },
    {
      name: 'relatedSubscription',
      type: 'relationship',
      relationTo: 'subscriptions',
      admin: {
        description: 'The subscription that initiated the trial',
      }
    }
  ],
}
