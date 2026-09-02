import { TaskConfig } from 'payload'
import { env } from '../../lib/env'

export const expireSubscriptionsTask: TaskConfig<'expireSubscriptions'> = {
  slug: 'expireSubscriptions',
  inputSchema: [],
  handler: async ({ req }) => {
    try {
      const payload = req.payload
      const now = new Date()

      // Find subscriptions that are past due and whose grace period has ended
      const gracePeriodExpired = await payload.find({
        collection: 'subscriptions',
        where: {
          and: [
            {
              status: {
                equals: 'past_due'
              }
            },
            {
              gracePeriodEndsAt: {
                less_than: now.toISOString()
              }
            }
          ]
        },
      })

      let count = 0;
      for (const sub of gracePeriodExpired.docs) {
          await payload.update({
              collection: 'subscriptions',
              id: sub.id,
              data: {
                  status: 'expired'
              }
          })

          await payload.create({
              collection: 'subscription-events',
              data: {
                  subscription: sub.id,
                  eventType: 'expired',
                  notes: 'Grace period expired automatically by job'
              }
          })
          count++
      }

      return {
        output: {
          success: true,
          expiredCount: count
        },
      }
    } catch (e: any) {
        req.payload.logger.error('Error expiring subscriptions', e)
        return {
            output: {
                success: false,
                error: e.message
            }
        }
    }
  },
}
