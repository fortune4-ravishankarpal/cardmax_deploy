import { Payload } from 'payload'

export const seedDummyData = async (payload: Payload) => {
    payload.logger.info('Seeding Phase 2 Dummy Data...')

    try {
        // 1. Create a Dummy User
        const existingUser = await payload.find({
            collection: 'users',
            where: { email: { equals: 'dummy@cardmax.com' } }
        })

        let userId = existingUser.docs[0]?.id
        if (!userId) {
            const user = await payload.create({
                collection: 'users',
                data: {
                    email: 'dummy@cardmax.com',
                    password: 'password123',
                    name: 'Dummy User',
                    accountStatus: 'active',
                    authenticationProvider: 'email',
                    profileCompleted: false,
                    acceptedTermsAndConditions: false,
                    acceptedPrivacyPolicy: false,
                }
            })
            userId = user.id
            payload.logger.info('Created Dummy User')
        }

        // 2. Find or create a Credit Card Master
        const existingCards = await payload.find({ collection: 'CreditCard', limit: 1 })
        const cardId = existingCards.docs[0]?.id
        if (!cardId) {
            payload.logger.info('No master credit cards found, skipping wallet seed.')
        }

        // 3. Subscription Plan
        const plan = await payload.find({ collection: 'subscription-plans', limit: 1 })
        const planId = plan.docs[0]?.id

        // 4. Trial Eligibility
        if (userId) {
            const existingTrial = await payload.find({
                collection: 'trial-eligibility',
                where: { user: { equals: userId } }
            })
            if (existingTrial.docs.length === 0) {
                await payload.create({
                    collection: 'trial-eligibility',
                    data: {
                        user: userId,
                        trialUsed: false
                    }
                })
                payload.logger.info('Created Trial Eligibility')
            }

            // 5. Subscription
            if (planId) {
                const existingSub = await payload.find({
                    collection: 'subscriptions',
                    where: { user: { equals: userId } }
                })
                let subId = existingSub.docs[0]?.id
                if (!subId) {
                    const sub = await payload.create({
                        collection: 'subscriptions',
                        data: {
                            user: userId,
                            plan: planId,
                            providerSubscriptionId: 'sub_dummy123',
                            status: 'active',
                            currentPeriodStart: new Date().toISOString(),
                            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                            cancelAtPeriodEnd: false
                        }
                    })
                    subId = sub.id
                    payload.logger.info('Created Subscription')

                    // 6. Payment
                    await payload.create({
                        collection: 'subscription-payments',
                        data: {
                            subscription: subId,
                            providerPaymentId: 'pay_dummy123',
                            amount: 499,
                            currency: 'INR',
                            status: 'captured'
                        }
                    })
                }
            }

            // 7. Consent
            const existingConsent = await payload.find({
                collection: 'consents',
                where: { user: { equals: userId }, purpose: { equals: 'analyse_inbox' } }
            })
            if (existingConsent.docs.length === 0) {
                await payload.create({
                    collection: 'consents',
                    data: {
                        user: userId,
                        purpose: 'analyse_inbox',
                        status: 'granted',
                        version: '1.0'
                    }
                })
                payload.logger.info('Created Consent')
            }

            // 8. User Card (Wallet)
            if (cardId) {
                const existingWallet = await payload.find({
                    collection: 'user-cards',
                    where: { user: { equals: userId } }
                })
                let userCardId = existingWallet.docs[0]?.id
                if (!userCardId) {
                    const wallet = await payload.create({
                        collection: 'user-cards',
                        data: {
                            user: userId,
                            card: cardId as any,
                            displayName: 'My Main Card',
                            creditLimit: 500000,
                            status: 'active'
                        }
                    })
                    userCardId = wallet.id
                    payload.logger.info('Created User Card (Wallet)')

                    // 9. User Goal
                    await payload.create({
                        collection: 'user-goals',
                        data: {
                            user: userId,
                            type: 'fee_waiver',
                            relatedCard: userCardId,
                            targetAmount: 300000,
                            currentAmount: 150000,
                            status: 'active'
                        }
                    })
                    payload.logger.info('Created User Goal')
                }
            }
        }
        payload.logger.info('Finished seeding Phase 2 dummy data!')
    } catch (error) {
        payload.logger.error({ err: error }, 'Error seeding dummy data')
    }
}
