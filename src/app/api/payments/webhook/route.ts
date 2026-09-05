import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { RazorpayProvider } from '../../../../payments/providers/razorpay'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const bodyText = await req.text()
    
    // 1. Verify signature
    const signature = req.headers.get('x-razorpay-signature')
    console.log(`[Webhook] Incoming request received. Signature: ${signature ? 'present' : 'missing'}`)

    if (!signature) {
      console.error('[Webhook] Rejected: Missing x-razorpay-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const provider = new RazorpayProvider()
    if (!provider.verifyWebhookSignature(bodyText, signature)) {
      console.error('[Webhook] Signature verification failed! Make sure RAZORPAY_WEBHOOK_SECRET in .env matches the Secret in Razorpay Dashboard exactly.')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(bodyText)
    const headerEventId = req.headers.get('x-razorpay-event-id')
    const eventId =
      headerEventId ||
      event.id ||
      event.event_id ||
      `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    console.log(`[Webhook] Signature verified! Event: ${event.event}, EventID: ${eventId}`)

    // 2. Persist event immediately (will throw on unique constraint if duplicate)
    try {
      const dbEvent = await payload.create({
        collection: 'provider-events',
        overrideAccess: true,
        data: {
          provider: 'razorpay',
          providerEventId: eventId,
          eventType: event.event || 'unknown',
          status: 'pending',
          rawPayload: event,
        }
      })

      // 3. Queue job to process async
      await payload.jobs.queue({
          task: 'processProviderEvent',
          input: {
              eventId: dbEvent.id
          }
      })

      // 4. Process event immediately so database updates in real-time
      try {
        const { processProviderEventTask } = await import('../../../../jobs/tasks/processProviderEvent')
        await (processProviderEventTask as any).handler({
          input: { eventId: dbEvent.id },
          req: { payload },
        })
      } catch (procErr) {
        payload.logger.error({ err: procErr }, 'Error processing provider event immediately')
      }

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      // If it's a unique constraint violation, we've already received this webhook
      if (dbError.message?.includes('duplicate key') || dbError.message?.includes('unique constraint')) {
        return NextResponse.json({ success: true, duplicate: true })
      }
      
      throw dbError
    }
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message || error.toString() }, { status: 500 })
  }
}
