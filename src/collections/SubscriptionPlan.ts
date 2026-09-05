import { CollectionConfig } from 'payload'

export const SubscriptionPlan: CollectionConfig = {
  slug: 'subscription-plans',
  admin: {
    group: 'Master',
    useAsTitle: 'name',
    defaultColumns: ['name', 'dataVersion', 'providerPlanId', 'price', 'billingInterval'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user && user.collection === 'admin') {
        return true
      }
      return {
        _status: {
          equals: 'published'
        }
      }
    },
    readVersions: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    create: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
  },
  trash: true,
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      }
    }
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'dataVersion',
      type: 'text',
      admin: {
        readOnly: true,
        position: "sidebar",
        description: 'Human-readable identifier for the published version.',
      },
      hooks: {
        beforeValidate: [({ value, operation }) => {
          if (operation === 'create' && !value) return 'v1'
          return value
        }]
      }
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
  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc }) => {
        // Draft and autosave operations must not alter the published label.
        if (data?._status !== 'published') {
          return data
        }

        if (operation === 'create') {
          data.dataVersion = 'v1'
          return data
        }

        const currentVersion = originalDoc?.dataVersion
        const versionNumber = /^v(\d+)$/.exec(currentVersion ?? '')?.[1]
        data.dataVersion = `v${Number(versionNumber ?? 0) + 1}`

        return data
      },
    ],
  },
  endpoints: [
    {
      path: '/active',
      method: 'get',
      handler: async (req) => {
        const plans = await req.payload.find({
          collection: 'subscription-plans',
          where: {
            isActive: { equals: true },
            _status: { equals: 'published' }
          },
          overrideAccess: true,
        })
        return Response.json(plans)
      }
    }
  ]
}
