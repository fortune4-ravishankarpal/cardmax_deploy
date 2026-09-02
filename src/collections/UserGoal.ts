import { CollectionConfig } from 'payload'

export const UserGoal: CollectionConfig = {
  slug: 'user-goals',
  admin: {
    group: 'Subscription & Max Pro',
    useAsTitle: 'type',
    defaultColumns: ['user', 'type', 'status', 'targetAmount', 'deadline'],
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
    create: ({ req: { user } }) => Boolean(user), // Authenticated users can create
    update: ({ req: { user } }) => {
        if (!user) return false;
        if (user.collection === 'admin') return true;
        return {
            user: {
                equals: user.id
            }
        };
    },
    delete: ({ req: { user } }) => {
        if (!user) return false;
        if (user.collection === 'admin') return true;
        return {
            user: {
                equals: user.id
            }
        };
    },
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
      name: 'type',
      type: 'select',
      options: [
        { label: 'Spend Threshold (Fee Waiver)', value: 'fee_waiver' },
        { label: 'Milestone Bonus', value: 'milestone_bonus' },
        { label: 'Reward Target (e.g., Flight)', value: 'reward_target' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Achieved', value: 'achieved' },
        { label: 'Failed', value: 'failed' }, // E.g., missed the deadline
        { label: 'Abandoned', value: 'abandoned' }, // User deleted/canceled it
      ],
      required: true,
      defaultValue: 'active',
      index: true,
    },
    {
      name: 'relatedCard',
      type: 'relationship',
      relationTo: 'user-cards',
      admin: {
        description: 'If this goal is tied to a specific card (like a fee waiver)',
      }
    },
    {
      name: 'targetAmount',
      type: 'number',
      required: true,
    },
    {
      name: 'currentAmount',
      type: 'number',
      defaultValue: 0,
      required: true,
    },
    {
      name: 'deadline',
      type: 'date',
    },
    {
      name: 'notes',
      type: 'textarea',
    }
  ],
}
