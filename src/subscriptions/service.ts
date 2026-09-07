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

    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    // Check trial eligibility
    const hasUsedTrial = await EntitlementsService.hasUsedTrial(userId)

    let startAt: number | undefined = undefined
    const isTrialOffered = !hasUsedTrial && Boolean(plan.trialDays && Number(plan.trialDays) > 0)
    if (isTrialOffered) {
      startAt = Math.floor(Date.now() / 1000) + Number(plan.trialDays) * 86400
    }

    const providerSub = await this.provider.createSubscription(
      plan.providerPlanId as string,
      undefined,
      {
        startAt,
        notes: {
          userId,
          planId: plan.id,
          userEmail: user?.email || '',
        },
      }
    )

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
        notes: `Subscription checkout created (Trial Used: ${hasUsedTrial}, Trial Offered: ${isTrialOffered})`
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
  static async syncSubscription(
    providerSubscriptionId: string,
    context?: {
      paymentStatus?: 'authorized' | 'captured' | 'failed' | 'refunded'
      paymentEntity?: any
      providerEventId?: string
    }
  ) {
    const payload = await getPayload({ config: configPromise })
    
    const subs = await payload.find({
      collection: 'subscriptions',
      where: {
        providerSubscriptionId: { equals: providerSubscriptionId }
      },
      limit: 1,
      overrideAccess: true,
    })

    if (subs.docs.length === 0) return null

    const sub = subs.docs[0]
    const plan =
      typeof sub.plan === 'object'
        ? (sub.plan as any)
        : await payload.findByID({ collection: 'subscription-plans', id: sub.plan as string })

    const providerSub = await this.provider.getSubscription(providerSubscriptionId)

    let newStatus: string = providerSub.status
    // If payment was captured, the subscription is active regardless of provider sync lag
    if (context?.paymentStatus === 'captured') {
      newStatus = 'active'
    } else if (context?.paymentStatus === 'authorized' && (!context.paymentEntity?.amount || context.paymentEntity.amount === 0)) {
      // 0-amount mandate auth represents trialing state
      newStatus = 'trialing'
    } else if ((providerSub.status as string) === 'authenticated') {
      newStatus = 'trialing'
    }

    // Check if subscription has any captured payments
    const capturedPayments = await payload.find({
      collection: 'subscription-payments',
      where: {
        and: [
          { subscription: { equals: sub.id } },
          { status: { equals: 'captured' } }
        ]
      },
      limit: 1,
      overrideAccess: true,
    })

    // If there is any captured payment or the subscription is already active, do not demote to created/pending
    if (capturedPayments.docs.length > 0 || sub.status === 'active') {
      if (['created', 'pending'].includes(newStatus)) {
        newStatus = 'active'
      }
    }

    let gracePeriodStartedAt = sub.gracePeriodStartedAt
    let gracePeriodEndsAt = sub.gracePeriodEndsAt

    // Handle grace period transition
    if ((newStatus as string) === 'past_due' && (sub.status as unknown as string) !== 'past_due') {
      gracePeriodStartedAt = new Date().toISOString()
      
      const graceDays = env.MAX_PRO_GRACE_PERIOD_DAYS
      const end = new Date()
      end.setDate(end.getDate() + graceDays)
      gracePeriodEndsAt = end.toISOString()
    } else if (newStatus === 'active' && (sub.status as unknown as string) === 'past_due') {
      // Recovered from past due
      gracePeriodStartedAt = null
      gracePeriodEndsAt = null
    }

    // Determine currentPeriodStart
    let periodStart: Date
    if (providerSub.currentStart && providerSub.currentStart.getTime() > 0) {
      periodStart = providerSub.currentStart
    } else if (sub.currentPeriodStart) {
      periodStart = new Date(sub.currentPeriodStart)
    } else if (context?.paymentEntity?.created_at) {
      periodStart = new Date(context.paymentEntity.created_at * 1000)
    } else {
      periodStart = new Date()
    }

    // Determine currentPeriodEnd
    let periodEnd: Date
    if (providerSub.currentEnd && providerSub.currentEnd.getTime() > 0) {
      periodEnd = providerSub.currentEnd
    } else if (sub.currentPeriodEnd) {
      periodEnd = new Date(sub.currentPeriodEnd)
    } else {
      const calcEnd = new Date(periodStart)
      if (newStatus === 'trialing' && plan?.trialDays) {
        calcEnd.setDate(calcEnd.getDate() + Number(plan.trialDays))
      } else if (plan?.billingInterval === 'yearly') {
        calcEnd.setFullYear(calcEnd.getFullYear() + 1)
      } else {
        // default monthly
        calcEnd.setMonth(calcEnd.getMonth() + 1)
      }
      periodEnd = calcEnd
    }

    const updated = await payload.update({
      collection: 'subscriptions',
      id: sub.id,
      overrideAccess: true,
      data: {
        status: newStatus as any,
        currentPeriodStart: periodStart.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        canceledAt: providerSub.status === 'cancelled' && sub.status !== 'canceled' ? new Date().toISOString() : sub.canceledAt,
        endedAt: providerSub.endedAt?.toISOString() || sub.endedAt,
        gracePeriodStartedAt,
        gracePeriodEndsAt,
      }
    })

    // If it is in active or trialing status, record trial usage & activation event
    const isActiveStatus = (status: string) => ['active', 'trialing', 'authenticated'].includes(status)
    if (isActiveStatus(newStatus as string)) {
       const userId = (sub.user as any)?.id || sub.user
       // Mark trial as used
       const existingEligibility = await payload.find({
          collection: 'trial-eligibility',
          where: { user: { equals: userId } },
          limit: 1,
          overrideAccess: true,
       })

       if (existingEligibility.docs.length > 0) {
           if (!existingEligibility.docs[0].trialUsed) {
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
           }
       } else {
           await payload.create({
               collection: 'trial-eligibility',
               overrideAccess: true,
               data: {
                   user: userId,
                   trialUsed: true,
                   trialUsedAt: new Date().toISOString(),
                   relatedSubscription: sub.id
               }
           })
       }

       if (!isActiveStatus(sub.status as unknown as string)) {
         await payload.create({
            collection: 'subscription-events',
            overrideAccess: true,
            data: {
              subscription: sub.id,
              eventType: 'activated',
              notes: context?.paymentEntity?.id ? `Subscription activated via payment ${context.paymentEntity.id}` : 'Subscription activated',
              providerEventId: context?.providerEventId,
            }
          })
       }
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
