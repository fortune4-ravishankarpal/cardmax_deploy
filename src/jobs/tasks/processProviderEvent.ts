import { TaskConfig } from 'payload'
import { SubscriptionService } from '../../subscriptions/service'

export const processProviderEventTask: TaskConfig<'processProviderEvent'> = {
  slug: 'processProviderEvent',
  inputSchema: [
    {
      name: 'eventId',
      type: 'text',
      required: true,
    }
  ],
  handler: async ({ input, req }) => {
    try {
      const eventId = input.eventId;
      
      const event = await req.payload.findByID({
        collection: 'provider-events',
        id: eventId
      })

      if (!event || event.status !== 'pending') {
         return {
             output: {
                 success: false,
                 reason: 'Event not found or not pending'
             }
         }
      }

      await req.payload.update({
          collection: 'provider-events',
          id: eventId,
          data: {
              status: 'processing'
          }
      })

      // Simple implementation just to trigger sync based on the provider ID
      // In a real implementation we would parse the event payload to figure out exactly what happened,
      // what subscription it applies to, and update payment tables too
      const payloadObj = event.rawPayload as any;
      let syncResult = null;

      if (event.provider === 'razorpay') {
          // Subscriptions webhook
          if (payloadObj.event && payloadObj.event.startsWith('subscription.')) {
              const subId = payloadObj.payload?.subscription?.entity?.id
              if (subId) {
                 syncResult = await SubscriptionService.syncSubscription(subId)
              }
          }
          
          // Handle payment records (payment.captured, payment.failed, subscription.charged)
          const paymentEntity = payloadObj.payload?.payment?.entity
          const subIdForPayment =
            paymentEntity?.subscription_id ||
            paymentEntity?.notes?.subscription_id ||
            payloadObj.payload?.subscription?.entity?.id

          if (paymentEntity && subIdForPayment) {
            const subs = await req.payload.find({
              collection: 'subscriptions',
              where: { providerSubscriptionId: { equals: subIdForPayment } },
              limit: 1,
            })

            if (subs.docs.length > 0) {
              const sub = subs.docs[0]
              const paymentStatusMap: Record<string, 'authorized' | 'captured' | 'failed' | 'refunded'> = {
                authorized: 'authorized',
                captured: 'captured',
                failed: 'failed',
                refunded: 'refunded',
              }
              const paymentStatus =
                paymentStatusMap[paymentEntity.status] ||
                (payloadObj.event === 'payment.failed' ? 'failed' : 'captured')

              try {
                const existingPayments = await req.payload.find({
                  collection: 'subscription-payments',
                  where: { providerPaymentId: { equals: paymentEntity.id } },
                  limit: 1,
                })

                if (existingPayments.docs.length > 0) {
                  await req.payload.update({
                    collection: 'subscription-payments',
                    id: existingPayments.docs[0].id,
                    data: {
                      status: paymentStatus,
                      rawEvent: payloadObj,
                    },
                  })
                } else {
                  await req.payload.create({
                    collection: 'subscription-payments',
                    data: {
                      subscription: sub.id,
                      providerPaymentId: paymentEntity.id,
                      amount: Number(paymentEntity.amount) / 100, // in Rupees
                      currency: paymentEntity.currency || 'INR',
                      status: paymentStatus,
                      rawEvent: payloadObj,
                    },
                  })
                }
              } catch (paymentErr) {
                req.payload.logger.error({ err: paymentErr }, 'Error recording subscription-payment')
              }

              // Send notification if applicable
              const userId = typeof sub.user === 'string' ? sub.user : (sub.user as any)?.id
              const statusText = paymentStatus === 'captured' ? 'succeeded' : paymentStatus
              if (userId) {
                await req.payload.jobs.queue({
                  task: 'sendNotification',
                  input: {
                    userId,
                    subject: `Payment ${statusText} for your CardMax Subscription`,
                    html: `<p>Your recent subscription payment has ${statusText}.</p>`,
                  },
                })
              }
            }
          }
      }

      await req.payload.update({
          collection: 'provider-events',
          id: eventId,
          data: {
              status: 'processed',
              processedAt: new Date().toISOString()
          }
      })

      return {
        output: {
          success: true,
          syncResult
        },
      }
    } catch (e: any) {
        req.payload.logger.error('Error processing provider event', e)
        await req.payload.update({
            collection: 'provider-events',
            id: input.eventId,
            data: {
                status: 'failed',
                errorDetails: e.message || 'Unknown error'
            }
        })

        return {
            output: {
                success: false,
                error: e.message
            }
        }
    }
  },
}
