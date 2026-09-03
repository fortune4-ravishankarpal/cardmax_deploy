import { TaskConfig } from 'payload'

export const fanoutDevaluationTask: TaskConfig<'fanoutDevaluation'> = {
  slug: 'fanoutDevaluation',
  inputSchema: [
    {
        name: 'creditCardId',
        type: 'text',
        required: true
    }
  ],
  handler: async ({ input, req }) => {
    try {
      // Find all UserCards linked to this CreditCard
      const affectedUserCards = await req.payload.find({
          collection: 'user-cards',
          where: { card: { equals: input.creditCardId } },
          limit: 1000 // In a production app, we would paginate this
      });
      
      let queuedCount = 0;
      for (const userCard of affectedUserCards.docs) {
          const userId = typeof userCard.user === 'string' ? userCard.user : (userCard.user as any)?.id;
          if (userId) {
              await req.payload.jobs.queue({
                  task: 'sendNotification',
                  input: {
                      userId,
                      subject: 'Alert: Credit Card Devaluation Detected',
                      html: '<p>We detected a devaluation on one of your saved credit cards. Check your CardMax dashboard for details.</p>'
                  }
              });
              queuedCount++;
          }
      }
      
      return {
        output: {
          success: true,
          notes: `Fan-out complete. Queued ${queuedCount} notifications.`
        },
      }
    } catch (e: any) {
        req.payload.logger.error('Error fanning out devaluation', e)
        return {
            output: {
                success: false,
                error: e.message
            }
        }
    }
  },
}
