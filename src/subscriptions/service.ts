import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { RazorpayProvider } from '../payments/providers/razorpay'
import { env } from '../lib/env'
import { EntitlementsService } from './entitlements'

export class SubscriptionService {
  private static provider = new RazorpayProvider()

  /**
   * Starts checkout process for a subscription
   */
  static async createCheckout(userId: string, planId: string) {
    const payload = await getPayload({ config: configPromise })
    
    const plan = await payload.findByID({
      collection: 'subscription-plans',
      id: planId
    })

    if (!plan || !plan.isActive) {
      throw new Error('Invalid or inactive plan')
    }

    // Check if user already has an active subscription
    if (await EntitlementsService.hasMaxPro(userId)) {
      throw new Error('User already has an active subscription')
    }

    // Check trial eligibility
    const hasUsedTrial = await EntitlementsService.hasUsedTrial(userId)

    const providerSub = await this.provider.createSubscription(plan.providerPlanId as string)

    const sub = await payload.create({
      collection: 'subscriptions',
      data: {
        user: userId,
        plan: plan.id,
        providerSubscriptionId: providerSub.id,
        status: 'created',
      }
    })

    await payload.create({
      collection: 'subscription-events',
      data: {
        subscription: sub.id,
        eventType: 'created',
        notes: `Subscription checkout created (Trial Used: ${hasUsedTrial})`
      }
    })

    return {
      subscriptionId: sub.id,
      shortUrl: providerSub.shortUrl
    }
  }

  /**
   * Syncs subscription state from the provider
   */
  static async syncSubscription(providerSubscriptionId: string) {
    const payload = await getPayload({ config: configPromise })
    
    const subs = await payload.find({
      collection: 'subscriptions',
      where: {
        providerSubscriptionId: { equals: providerSubscriptionId }
      },
      limit: 1
    })

    if (subs.docs.length === 0) return null

    const sub = subs.docs[0]
    const providerSub = await this.provider.getSubscription(providerSubscriptionId)

    let newStatus = providerSub.status
    let gracePeriodStartedAt = sub.gracePeriodStartedAt
    let gracePeriodEndsAt = sub.gracePeriodEndsAt

    // Handle grace period transition
    if ((providerSub.status as string) === 'past_due' && (sub.status as unknown as string) !== 'past_due') {
      gracePeriodStartedAt = new Date().toISOString()
      
      const graceDays = env.MAX_PRO_GRACE_PERIOD_DAYS
      const end = new Date()
      end.setDate(end.getDate() + graceDays)
      gracePeriodEndsAt = end.toISOString()
    } else if (providerSub.status === 'active' && (sub.status as unknown as string) === 'past_due') {
      // Recovered from past due
      gracePeriodStartedAt = null
      gracePeriodEndsAt = null
    }

    const updated = await payload.update({
      collection: 'subscriptions',
      id: sub.id,
      overrideAccess: true,
      data: {
        status: newStatus as any,
        currentPeriodStart: providerSub.currentStart.toISOString(),
        currentPeriodEnd: providerSub.currentEnd.toISOString(),
        canceledAt: providerSub.status === 'cancelled' && sub.status !== 'canceled' ? new Date().toISOString() : sub.canceledAt,
        endedAt: providerSub.endedAt?.toISOString() || sub.endedAt,
        gracePeriodStartedAt,
        gracePeriodEndsAt,
      }
    })

    // If it just transitioned to active, trialing, or authenticated, record trial usage & event
    const isActiveStatus = (status: string) => ['active', 'trialing', 'authenticated'].includes(status)
    if (isActiveStatus(newStatus as string) && !isActiveStatus(sub.status as unknown as string)) {
       // Mark trial as used
       const existingEligibility = await payload.find({
          collection: 'trial-eligibility',
          where: { user: { equals: (sub.user as any).id || sub.user } },
          limit: 1,
          overrideAccess: true,
       })

       if (existingEligibility.docs.length > 0) {
           await payload.update({
               collection: 'trial-eligibility',
               id: existingEligibility.docs[0].id,
               overrideAccess: true,
               data: {
                   trialUsed: true,
                   trialUsedAt: existingEligibility.docs[0].trialUsedAt || new Date().toISOString(),
                   relatedSubscription: existingEligibility.docs[0].relatedSubscription || sub.id
               }
           })
       } else {
           await payload.create({
               collection: 'trial-eligibility',
               overrideAccess: true,
               data: {
                   user: (sub.user as any).id || sub.user,
                   trialUsed: true,
                   trialUsedAt: new Date().toISOString(),
                   relatedSubscription: sub.id
               }
           })
       }

       await payload.create({
          collection: 'subscription-events',
          overrideAccess: true,
          data: {
            subscription: sub.id,
            eventType: 'activated',
          }
        })
    }

    return updated
  }

  static async cancelSubscription(userId: string, subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
     const payload = await getPayload({ config: configPromise })

     const sub = await payload.findByID({
         collection: 'subscriptions',
         id: subscriptionId
     })

     if (!sub || (sub.user as any).id !== userId && sub.user !== userId) {
         throw new Error('Not found')
     }

     // Ensure subscription is synced first to establish current active state
     await this.syncSubscription(sub.providerSubscriptionId)

     await this.provider.cancelSubscription(sub.providerSubscriptionId, cancelAtPeriodEnd)

     // Wait for webhook or immediately mark pending cancel
     if (cancelAtPeriodEnd) {
         await payload.update({
             collection: 'subscriptions',
             id: sub.id,
             overrideAccess: true,
             data: {
                 cancelAtPeriodEnd: true
             }
         })
     }

     await payload.create({
          collection: 'subscription-events',
          overrideAccess: true,
          data: {
            subscription: sub.id,
            eventType: 'canceled',
            notes: `Canceled by user. At period end: ${cancelAtPeriodEnd}`
          }
     })

     const refreshed = await payload.findByID({
         collection: 'subscriptions',
         id: sub.id,
         overrideAccess: true,
     })

     return refreshed
  }
}
