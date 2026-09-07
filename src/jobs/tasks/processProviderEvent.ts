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
        id: eventId,
        overrideAccess: true,
      })

      if (!event || (event.status !== 'pending' && event.status !== 'processing')) {
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
          overrideAccess: true,
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
          
          // Handle payment records (payment.captured, payment.failed, payment.authorized, subscription.charged)
          const paymentEntity = payloadObj.payload?.payment?.entity
          let subIdForPayment =
            paymentEntity?.subscription_id ||
            paymentEntity?.notes?.subscription_id ||
            payloadObj.payload?.subscription?.entity?.id ||
            payloadObj.payload?.invoice?.entity?.subscription_id

          // Fallback: If subscription ID is not in payment entity, resolve via invoice
          if (!subIdForPayment && paymentEntity?.invoice_id) {
            try {
              const { RazorpayProvider } = await import('../../payments/providers/razorpay')
              const provider = new RazorpayProvider()
              const invoice = await provider.getInvoice(paymentEntity.invoice_id)
              if (invoice?.subscription_id) {
                subIdForPayment = invoice.subscription_id
              }
            } catch (invErr) {
              req.payload.logger.error({ err: invErr }, 'Error fetching invoice from Razorpay to resolve subscription')
            }
          }

          if (paymentEntity && subIdForPayment) {
            const paymentStatusMap: Record<string, 'authorized' | 'captured' | 'failed' | 'refunded'> = {
              authorized: 'authorized',
              captured: 'captured',
              failed: 'failed',
              refunded: 'refunded',
            }
            const paymentStatus =
              paymentStatusMap[paymentEntity.status] ||
              (payloadObj.event === 'payment.failed' ? 'failed' : 'captured')

            // Ensure subscription state is synced upon payment confirmation
            try {
              syncResult = await SubscriptionService.syncSubscription(subIdForPayment, {
                paymentStatus,
                paymentEntity,
                providerEventId: event.providerEventId,
              })
            } catch (syncErr) {
              req.payload.logger.error({ err: syncErr }, 'Error syncing subscription from payment event')
            }

            const subs = await req.payload.find({
              collection: 'subscriptions',
              where: { providerSubscriptionId: { equals: subIdForPayment } },
              limit: 1,
              overrideAccess: true,
            })

            if (subs.docs.length > 0) {
              const sub = subs.docs[0]

              try {
                const existingPayments = await req.payload.find({
                  collection: 'subscription-payments',
                  where: { providerPaymentId: { equals: paymentEntity.id } },
                  limit: 1,
                  overrideAccess: true,
                })

                if (existingPayments.docs.length > 0) {
                  const currentPayment = existingPayments.docs[0]
                  const finalStatus =
                    currentPayment.status === 'captured' && paymentStatus === 'authorized'
                      ? 'captured'
                      : paymentStatus

                  await req.payload.update({
                    collection: 'subscription-payments',
                    id: currentPayment.id,
                    overrideAccess: true,
                    data: {
                      status: finalStatus,
                      rawEvent: payloadObj,
                    },
                  })
                } else {
                  await req.payload.create({
                    collection: 'subscription-payments',
                    overrideAccess: true,
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
          overrideAccess: true,
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
        req.payload.logger.error({ err: e }, 'Error processing provider event')
        await req.payload.update({
            collection: 'provider-events',
            id: input.eventId,
            overrideAccess: true,
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
