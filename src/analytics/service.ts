import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface TrackEventOptions {
  userId?: string
  anonymousId?: string
  event: string
  category?: string
  properties?: Record<string, any>
  url?: string
  userAgent?: string
  ipAddress?: string
}

export class AnalyticsService {
  /**
   * Non-blocking track function
   */
  static track(options: TrackEventOptions) {
    // Fire and forget
    this.persistEvent(options).catch(console.error)
  }

  private static async persistEvent(options: TrackEventOptions) {
    const payload = await getPayload({ config: configPromise })
    
    await payload.create({
      collection: 'analytics-events',
      overrideAccess: true,
      data: {
        user: options.userId,
        anonymousId: options.anonymousId,
        event: options.event,
        category: options.category,
        properties: options.properties,
        url: options.url,
        userAgent: options.userAgent,
        ipAddress: options.ipAddress,
      }
    })
  }
}
