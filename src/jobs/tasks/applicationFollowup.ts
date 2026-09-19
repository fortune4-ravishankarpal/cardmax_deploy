// TaskConfig will be properly typed after pnpm generate:types is run

/**
 * applicationFollowup task
 *
 * Scheduled via Payload Jobs (runs every minute with the autoRun cron).
 * Finds card applications where:
 *   - followUpDate <= now
 *   - status is pending/under_review (still actionable)
 *
 * Queues APPLICATION_FOLLOWUP notifications for affected users.
 * Should be triggered by queueing this task; the jobs runner picks it up.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const applicationFollowupTask: any = {
  slug: 'applicationFollowup',
  inputSchema: [],
  handler: async ({ req }: { req: any }) => {
    try {
      const now = new Date().toISOString()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const applications = await (req.payload.find as any)({
        collection: 'card-applications',
        where: {
          and: [
            { followUpDate: { less_than_equal: now } },
            {
              or: [
                { status: { equals: 'submitted' } },
                { status: { equals: 'under_review' } },
              ],
            },
          ],
        },
        limit: 200,
        depth: 0,
        overrideAccess: true,
      })

      let queued = 0
      for (const app of applications.docs as any[]) {
        const userId = typeof app.user === 'string' ? app.user : (app.user as any)?.id
        if (!userId) continue

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (req.payload.jobs.queue as any)({
          task: 'sendNotification',
          input: {
            eventId: `APPLICATION_FOLLOWUP_${app.id}_${now}`,
            eventType: 'APPLICATION_FOLLOWUP',
            userId,
            eventData: {
              applicationId: app.id,
              applicationNumber: app.applicationNumber,
              status: app.status,
            },
          },
        })
        queued++
      }

      return {
        output: {
          success: true,
          notes: `Queued ${queued} application follow-up notifications.`,
        },
      }
    } catch (e: any) {
      req.payload.logger.error({ err: e }, 'Error in applicationFollowup task')
      return { output: { success: false, error: e.message } }
    }
  },
}
