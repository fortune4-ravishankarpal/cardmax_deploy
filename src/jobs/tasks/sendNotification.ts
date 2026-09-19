import { TaskConfig } from 'payload'
import { NotificationService } from '../../notifications/service'
import type { NotificationEventType } from '../../notifications/types'

/**
 * sendNotification task (refactored for 8.18 & 8.19)
 *
 * Primary interface for queuing notification events via the Jobs system.
 * Delegates to NotificationService.publishEvent for multi-channel dispatch.
 *
 * Backward-compatible: if only userId/subject/html are provided (legacy),
 * falls back to raw email + in-app creation.
 */
export const sendNotificationTask: TaskConfig<'sendNotification'> = {
  slug: 'sendNotification',
  inputSchema: [
    // New event-driven schema
    {
      name: 'eventId',
      type: 'text',
    },
    {
      name: 'eventType',
      type: 'text',
    },
    {
      name: 'userId',
      type: 'text',
      required: true,
    },
    {
      name: 'eventData',
      type: 'json',
    },
    // Legacy fields (backward compat — used by fanoutDevaluation before refactor)
    {
      name: 'subject',
      type: 'text',
    },
    {
      name: 'html',
      type: 'text',
    },
  ],
  handler: async ({ input, req }) => {
    try {
      const { eventId, eventType, userId, eventData, subject, html } = input as any

      // ── New event-driven path ───────────────────────────────────────────────
      if (eventType && userId) {
        const result = await NotificationService.publishEvent(
          {
            eventId: eventId || `${eventType}_${userId}_${Date.now()}`,
            eventType: eventType as NotificationEventType,
            userId,
            data: eventData ?? {},
          },
          req.payload,
        )
        return {
          output: {
            success: true,
            notificationGroupId: result.notificationGroupId,
            channels: result.channels.length,
          },
        }
      }

      // ── Legacy path (backward compat) ───────────────────────────────────────
      if (userId && subject && html) {
        await NotificationService.sendEmailNotification(userId, subject, html)
        await NotificationService.createNotification({
          userId,
          type: 'payment',
          title: subject,
          message: html,
        })
        return { output: { success: true } }
      }

      return {
        output: { success: false, error: 'Missing required input: userId + (eventType or subject/html)' },
      }
    } catch (e: any) {
      req.payload.logger.error({ err: e }, 'Error in sendNotification task')
      return { output: { success: false, error: e.message } }
    }
  },
}
