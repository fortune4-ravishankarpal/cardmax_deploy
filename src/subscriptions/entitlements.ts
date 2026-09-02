import { getPayload } from 'payload'
import configPromise from '@payload-config'

export class EntitlementsService {
  /**
   * Checks if a user has an active Max Pro entitlement.
   * This considers active subscriptions and grace periods.
   */
  static async hasMaxPro(userId: string): Promise<boolean> {
    const payload = await getPayload({ config: configPromise })
    
    // Check for active or trailing subscriptions
    const subscriptions = await payload.find({
      collection: 'subscriptions',
      where: {
        and: [
          {
            user: {
              equals: userId
            }
          },
          {
            or: [
              { status: { equals: 'active' } },
              { status: { equals: 'trialing' } },
              { status: { equals: 'past_due' } }, // In grace period
              { status: { equals: 'canceled' } }, // Canceled but active until period end
            ]
          }
        ]
      },
    })

    const now = new Date()

    for (const sub of subscriptions.docs) {
      if (sub.status === 'active' || sub.status === 'trialing') {
        return true
      }

      if (sub.status === 'canceled' && sub.currentPeriodEnd) {
        if (new Date(sub.currentPeriodEnd) > now) {
          return true
        }
      }

      // If in grace period, check if the grace period is still valid
      if (sub.status === 'past_due' && sub.gracePeriodEndsAt) {
         if (new Date(sub.gracePeriodEndsAt) > now) {
            return true
         }
      }
    }

    return false
  }

  /**
   * Helper to determine if the user has used a trial
   */
  static async hasUsedTrial(userId: string): Promise<boolean> {
     const payload = await getPayload({ config: configPromise })
     
     const eligibility = await payload.find({
        collection: 'trial-eligibility',
        where: {
            user: { equals: userId }
        },
        limit: 1
     })

     if (eligibility.docs.length > 0) {
        return Boolean(eligibility.docs[0].trialUsed)
     }

     return false
  }
}
