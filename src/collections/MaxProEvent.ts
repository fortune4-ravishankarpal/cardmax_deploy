import { CollectionConfig } from 'payload'

export const MaxProEvent: CollectionConfig = {
  slug: 'max-pro-events',
  admin: {
    group: 'Subscription & Max Pro',
    useAsTitle: 'eventType',
    defaultColumns: ['user', 'eventType', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
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
      name: 'eventType',
      type: 'select',
      options: [
        { label: 'Devaluation Detected', value: 'devaluation_detected' },
        { label: 'Target Spend Insight', value: 'target_spend_insight' },
        { label: 'Missing Card Warning', value: 'missing_card_warning' },
        { label: 'Weekly Summary', value: 'weekly_summary' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Generated', value: 'generated' }, // Waiting to be notified
        { label: 'Notified', value: 'notified' },   // Notification sent
        { label: 'Dismissed', value: 'dismissed' }, // User dismissed it
        { label: 'Acted Upon', value: 'acted_upon' },// User took action
      ],
      required: true,
      defaultValue: 'generated',
    },
    {
      name: 'priority',
      type: 'select',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
      ],
      required: true,
      defaultValue: 'low',
    },
    {
      name: 'engineJobId',
      type: 'text',
      admin: {
        description: 'Reference to the FastAPI engine job that produced this insight',
      }
    },
    {
      name: 'payload',
      type: 'json',
      admin: {
        description: 'Structured data for rendering the insight (e.g. which cards devalued, amounts)',
      }
    }
  ],
}
