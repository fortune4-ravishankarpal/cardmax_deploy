import { Payload } from 'payload'

export const seedSubscriptionPlans = async (payload: Payload) => {
  payload.logger.info('Seeding subscription plans...')

  try {
    const existing = await payload.find({
      collection: 'subscription-plans',
      where: {
        providerPlanId: { equals: 'plan_rs499_yr' }, // Mock ID
      },
    })

    if (existing.docs.length === 0) {
      await payload.create({
        collection: 'subscription-plans',
        data: {
          name: 'CardMax Pro - Annual',
          description: 'Unlimited insights, target tracking, and real-time devaluation alerts.',
          providerPlanId: 'plan_rs499_yr',
          price: 49900, // paisa
          currency: 'INR',
          billingInterval: 'yearly',
          trialDays: 7,
          isActive: true,
        },
      })
      payload.logger.info('Created Annual Pro Plan')
    } else {
      payload.logger.info('Annual Pro Plan already exists')
    }
  } catch (error) {
    payload.logger.error({ err: error }, 'Error seeding subscription plans')
  }
}
