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
