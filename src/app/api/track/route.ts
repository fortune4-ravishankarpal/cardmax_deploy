import { NextResponse } from 'next/server'
import { AnalyticsService } from '@/analytics/service'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Ensure an event name is provided
    if (!body.event) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }

    // Capture useful context from headers
    const userAgent = req.headers.get('user-agent') || undefined
    const ipAddress = req.headers.get('x-forwarded-for') || undefined

    // Call the backend service
    AnalyticsService.track({
      event: body.event,
      category: body.category,
      properties: body.properties,
      userId: body.userId,
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
