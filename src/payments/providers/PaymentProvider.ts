export interface SubscriptionPlanDetails {
  id: string
  name: string
  description?: string
  amount: number
  currency: string
  interval: 'day' | 'week' | 'month' | 'year'
  intervalCount: number
}

export interface SubscriptionDetails {
  id: string
  planId: string
  status: 'active' | 'created' | 'authenticated' | 'pending' | 'halted' | 'cancelled' | 'completed' | 'expired'
  currentStart?: Date | null
  currentEnd?: Date | null
  chargeAt?: Date
  endedAt?: Date
}

export interface PaymentProvider {
  /**
   * Identifies the provider (e.g. 'razorpay', 'stripe')
   */
  readonly id: string

  /**
   * Creates a new plan in the payment provider
   */
  createPlan?(params: {
    name: string
    description?: string
    amount: number
    currency: string
    interval: 'monthly' | 'yearly'
  }): Promise<{ id: string }>

  /**
   * Retrieves plan details from the provider
   */
  getPlan(providerPlanId: string): Promise<SubscriptionPlanDetails>

  /**
   * Creates a new subscription for a customer
   */
  createSubscription(
    providerPlanId: string,
    customerId?: string,
    options?: {
      startAt?: number
      notes?: Record<string, string>
    }
  ): Promise<{ id: string; shortUrl: string }>

  /**
   * Retrieves subscription details from the provider
   */
  getSubscription(providerSubscriptionId: string): Promise<SubscriptionDetails>

  /**
   * Retrieves invoice details from the provider
   */
  getInvoice?(invoiceId: string): Promise<any>

  /**
   * Cancels an active subscription
   */
  cancelSubscription(providerSubscriptionId: string, cancelAtCycleEnd?: boolean): Promise<void>

  /**
   * Verifies an incoming webhook payload
   */
  verifyWebhookSignature(body: string, signature: string): boolean
}
