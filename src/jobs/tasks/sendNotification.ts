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
