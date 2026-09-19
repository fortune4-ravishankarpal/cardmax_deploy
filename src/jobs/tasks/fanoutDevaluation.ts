import { TaskConfig } from 'payload'

/**
 * fanoutDevaluation task (updated for 8.18 & 8.19)
 *
 * Fans out DEVALUATION_DETECTED events to all users who hold the
 * affected credit card. Uses the new event-driven sendNotification
 * task schema with proper eventId for idempotency.
 */
export const fanoutDevaluationTask: TaskConfig<'fanoutDevaluation'> = {
  slug: 'fanoutDevaluation',
  inputSchema: [
    {
      name: 'creditCardId',
      type: 'text',
      required: true,
    },
  ],
  handler: async ({ input, req }) => {
    try {
      // Find all UserCards linked to this CreditCard
      const affectedUserCards = await req.payload.find({
        collection: 'user-cards',
        where: { card: { equals: input.creditCardId } },
        limit: 1000, // In a production app, paginate this
        depth: 0,
        overrideAccess: true,
      })

      let queuedCount = 0
      const dedupeSet = new Set<string>()

      for (const userCard of affectedUserCards.docs) {
        const userId = typeof userCard.user === 'string'
          ? userCard.user
          : (userCard.user as any)?.id

        if (!userId || dedupeSet.has(userId)) continue
        dedupeSet.add(userId)

        // Deterministic eventId so retrying the job doesn't re-notify the same user
        const eventId = `DEVALUATION_DETECTED_${input.creditCardId}_${userId}`

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (req.payload.jobs.queue as any)({
          task: 'sendNotification',
          input: {
            eventId,
            eventType: 'DEVALUATION_DETECTED',
            userId,
            eventData: {
              creditCardId: input.creditCardId,
            },
          },
        })
        queuedCount++
      }

      return {
        output: {
          success: true,
          notes: `Fan-out complete. Queued ${queuedCount} DEVALUATION_DETECTED notifications.`,
        },
      }
    } catch (e: any) {
      req.payload.logger.error({ err: e }, 'Error fanning out devaluation')
      return { output: { success: false, error: e.message } }
    }
  },
}
