import { CollectionConfig } from 'payload'

export const SubscriptionPlan: CollectionConfig = {
  slug: 'subscription-plans',
  admin: {
    group: 'Subscription & Max Pro',
    useAsTitle: 'name',
    defaultColumns: ['name', 'providerPlanId', 'price', 'billingInterval'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'providerPlanId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'The plan ID from Razorpay (e.g. plan_N4Rxxxxx)',
      }
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      admin: {
        description: 'The display price of the plan in Rupees (e.g. 199)',
      }
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
      defaultValue: 'INR',
    },
    {
      name: 'billingInterval',
      type: 'select',
      options: [
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
      ],
      required: true,
    },
    {
      name: 'trialDays',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Number of trial days offered for this plan',
      }
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this plan is available for new subscriptions',
      }
    }
  ],
}
