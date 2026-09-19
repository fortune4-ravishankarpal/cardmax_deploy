import type { CollectionConfig } from 'payload'

/**
 * CardApplication collection
 *
 * Tracks a user's credit card application lifecycle.
 * Status transitions publish APPLICATION_STATUS_CHANGED notifications.
 *
 * Statuses:
 *   submitted → under_review → approved | rejected | documents_needed
 */
export const CardApplication: CollectionConfig = {
  slug: 'card-applications',
  labels: { singular: 'Card Application', plural: 'Card Applications' },
  admin: {
    group: 'Users',
    useAsTitle: 'applicationNumber',
    defaultColumns: ['user', 'card', 'applicationNumber', 'status', 'appliedAt', 'followUpDate'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'admin') return true
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'admin') return true
      return { user: { equals: user.id } }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.collection === 'admin') return true
      return { user: { equals: user.id } }
    },
  },
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        // Guard: skip if this hook already fired for this request to prevent loops
        if ((req.context as any)?.skipNotificationHook) return

        // Only fire on genuine status transitions (not create or same-status save)
        const isTransition =
          operation === 'create'
            ? doc.status === 'submitted'
            : previousDoc?.status !== doc.status

        if (!isTransition) return

        try {
          const userId = typeof doc.user === 'string' ? doc.user : (doc.user as any)?.id
          if (!userId) return

          const { NotificationService } = await import('../notifications/service')
          const eventId = `APPLICATION_STATUS_CHANGED_${doc.id}_${doc.status}_${Date.now()}`

          await NotificationService.publishEvent(
            {
              eventId,
              eventType: 'APPLICATION_STATUS_CHANGED',
              userId,
              data: {
                applicationId: doc.id,
                applicationNumber: doc.applicationNumber,
                status: doc.status,
                previousStatus: previousDoc?.status,
              },
            },
            req.payload,
          )
        } catch (e) {
          req.payload.logger.error({ err: e }, 'Failed to publish APPLICATION_STATUS_CHANGED')
        }
      },
    ],
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
      name: 'card',
      type: 'relationship',
      relationTo: 'CreditCard',
      required: true,
      admin: {
        description: 'The credit card this application is for.',
      },
    },
    {
      name: 'applicationNumber',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        description: 'Provider or internal reference number for the application.',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Submitted', value: 'submitted' },
        { label: 'Under Review', value: 'under_review' },
        { label: 'Documents Needed', value: 'documents_needed' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      required: true,
      defaultValue: 'submitted',
      index: true,
    },
    {
      name: 'appliedAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'followUpDate',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When the applicationFollowup job should next check this application.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
