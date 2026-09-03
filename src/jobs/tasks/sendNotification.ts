import { TaskConfig } from 'payload'
import { NotificationService } from '../../notifications/service'

export const sendNotificationTask: TaskConfig<'sendNotification'> = {
  slug: 'sendNotification',
  inputSchema: [
    {
        name: 'userId',
        type: 'text',
        required: true
    },
    {
        name: 'subject',
        type: 'text',
        required: true
    },
    {
        name: 'html',
        type: 'text',
        required: true
    }
  ],
  handler: async ({ input, req }) => {
    try {
      await NotificationService.sendEmailNotification(input.userId, input.subject, input.html)
      
      // Also create an in-app notification so it appears in the database and Admin UI
      await NotificationService.createNotification({
          userId: input.userId,
          type: 'payment', // using payment since these are usually payment/subscription related
          title: input.subject,
          message: input.html
      })
      
      return {
        output: {
          success: true,
        },
      }
    } catch (e: any) {
        req.payload.logger.error('Error sending notification task', e)
        return {
            output: {
                success: false,
                error: e.message
            }
        }
    }
  },
}
