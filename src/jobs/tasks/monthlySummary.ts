import { TaskConfig } from 'payload'

/**
 * monthlySummary task
 *
 * Generates and queues MONTHLY_SUMMARY notifications for all active users
 * who have emailEnabled and monthlySummaryEmails preferences turned on.
 *
 * Trigger: queue this task at the start of each month via an external cron
 * or from an admin action. The jobs runner will process it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const monthlySummaryTask: any = {
  slug: 'monthlySummary',
  inputSchema: [
    {
      name: 'month',
      type: 'text',
      // e.g. "2026-08" — if omitted, uses previous month
    },
  ],
  handler: async ({ input, req }: { input: any; req: any }) => {
    try {
      const now = new Date()
      const month = (input as any).month || (() => {
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`
      })()

      // Find all active users with monthly summary emails enabled
      // (Postgres: filter on nested group field)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const usersResult = await (req.payload.find as any)({
        collection: 'users',
        where: {
          and: [
            { accountStatus: { equals: 'active' } },
            { 'notificationPreferences.emailEnabled': { not_equals: false } },
            { 'notificationPreferences.monthlySummaryEmails': { not_equals: false } },
          ],
        },
        limit: 500,
        depth: 0,
        overrideAccess: true,
      })

      let queued = 0
      for (const user of usersResult.docs) {
        const eventId = `MONTHLY_SUMMARY_${user.id}_${month}`

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (req.payload.jobs.queue as any)({
          task: 'sendNotification',
          input: {
            eventId,
            eventType: 'MONTHLY_SUMMARY',
            userId: String(user.id),
            eventData: { month },
          },
        })
        queued++
      }

      req.payload.logger.info(
        { month, queued },
        '[monthlySummary] Queued monthly summary notifications',
      )

      return {
        output: {
          success: true,
          notes: `Queued ${queued} MONTHLY_SUMMARY notifications for ${month}.`,
        },
      }
    } catch (e: any) {
      req.payload.logger.error({ err: e }, 'Error in monthlySummary task')
      return { output: { success: false, error: e.message } }
    }
  },
}
