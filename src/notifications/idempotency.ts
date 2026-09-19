import type { Payload } from 'payload'
import type { NotificationChannel } from './types'

/**
 * Idempotency check for notification delivery.
 *
 * Before creating a Notification record, call this to verify
 * no record with the same (eventId, channel) already exists.
 * This prevents duplicate sends even under retry or concurrent processing.
 */
export async function isEventProcessed(
  payload: Payload,
  eventId: string,
  channel: NotificationChannel,
): Promise<boolean> {
  const result = await payload.find({
    collection: 'notifications',
    where: {
      and: [
        { eventId: { equals: eventId } },
        { channel: { equals: channel } },
      ],
    },
    limit: 1,
    depth: 0,
    // System check — bypass access control
    overrideAccess: true,
  })

  return result.totalDocs > 0
}
