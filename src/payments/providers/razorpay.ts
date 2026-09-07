import Razorpay from 'razorpay'
import crypto from 'crypto'
import { env } from '../../lib/env'
import { PaymentProvider, SubscriptionDetails, SubscriptionPlanDetails } from './PaymentProvider'

export class RazorpayProvider implements PaymentProvider {
  readonly id = 'razorpay'
  private client: any

  constructor() {
    this.client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    })
  }

  async createPlan(params: {
    name: string
    description?: string
    amount: number
    currency?: string
    interval: 'monthly' | 'yearly'
  }): Promise<{ id: string }> {
    const period = params.interval === 'yearly' ? 'yearly' : 'monthly'
    const plan = await this.client.plans.create({
      period,
      interval: 1,
      item: {
        name: params.name,
        amount: params.amount, // in paise
        currency: params.currency || 'INR',
        description: params.description || undefined,
      },
    })

    return { id: plan.id }
  }

  async getPlan(providerPlanId: string): Promise<SubscriptionPlanDetails> {
    const plan = await this.client.plans.fetch(providerPlanId)
    
    return {
      id: plan.id,
      name: plan.item.name,
      description: plan.item.description,
      amount: plan.item.amount,
      currency: plan.item.currency,
      interval: plan.period,
      intervalCount: plan.interval,
    }
  }

  async createSubscription(
    providerPlanId: string,
    customerId?: string,
    options?: {
      startAt?: number
      notes?: Record<string, string>
    }
  ): Promise<{ id: string; shortUrl: string }> {
    const payload: any = {
      plan_id: providerPlanId,
      total_count: 1200, // 100 years by default for 'forever' subscriptions until cancelled
      customer_notify: 1,
    }
    
    // Not attaching customer_id forces Razorpay to collect customer info during checkout if not provided
    // If it is provided, razorpay will attach the subscription to that existing customer
    if (customerId) {
        payload.customer_id = customerId;
    }

    if (options?.startAt) {
      payload.start_at = options.startAt
    }

    if (options?.notes) {
      payload.notes = options.notes
    }

    const subscription = await this.client.subscriptions.create(payload)

    return {
      id: subscription.id,
      shortUrl: subscription.short_url,
    }
  }

  async getInvoice(invoiceId: string): Promise<any> {
    return await this.client.invoices.fetch(invoiceId)
  }

  async getSubscription(providerSubscriptionId: string): Promise<SubscriptionDetails> {
    const subscription = await this.client.subscriptions.fetch(providerSubscriptionId)
    
    return {
      id: subscription.id,
      planId: subscription.plan_id,
      status: subscription.status as SubscriptionDetails['status'],
      currentStart: subscription.current_start ? new Date(subscription.current_start * 1000) : null,
      currentEnd: subscription.current_end ? new Date(subscription.current_end * 1000) : null,
      chargeAt: subscription.charge_at ? new Date(subscription.charge_at * 1000) : undefined,
      endedAt: subscription.ended_at ? new Date(subscription.ended_at * 1000) : undefined,
    }
  }

  async cancelSubscription(
    providerSubscriptionId: string,
    cancelAtCycleEnd: boolean = false
  ): Promise<void> {
    await this.client.subscriptions.cancel(providerSubscriptionId, cancelAtCycleEnd)
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex')

    return expectedSignature === signature
  }
}
