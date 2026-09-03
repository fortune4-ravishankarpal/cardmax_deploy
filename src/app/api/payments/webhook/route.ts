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
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const provider = new RazorpayProvider()
    if (!provider.verifyWebhookSignature(bodyText, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(bodyText)
    const eventId = event.id // Razorpay event ID

    // 2. Persist event immediately (will throw on unique constraint if duplicate)
    try {
      const dbEvent = await payload.create({
        collection: 'provider-events',
        overrideAccess: true,
        data: {
          provider: 'razorpay',
          providerEventId: eventId,
          eventType: event.event,
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
