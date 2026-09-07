import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { AnalyticsService } from '@/analytics/service'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Ensure an event name is provided
    if (!body.event) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }

    let userId = body.userId

    // If userId not provided in body, extract from authenticated request session
    if (!userId) {
      try {
        const payload = await getPayload({ config: configPromise })
        const { user } = await payload.auth({ headers: req.headers })
        if (user) {
          userId = user.id
        }
      } catch (authErr) {
        // Fall through if unauthenticated
      }
    }

    // Capture useful context from headers
    const userAgent = req.headers.get('user-agent') || undefined
    const ipAddress = req.headers.get('x-forwarded-for') || undefined

    // Call the backend service
    AnalyticsService.track({
      event: body.event,
      category: body.category,
      properties: body.properties,
      userId,
      anonymousId: body.anonymousId,
      url: body.url,
      userAgent,
      ipAddress,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Analytics track error:', err)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
