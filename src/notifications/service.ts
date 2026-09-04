import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { env } from '../lib/env'

export interface CreateNotificationOptions {
  userId: string
  type: 'system' | 'payment' | 'subscription' | 'alert'
  title: string
  message: string
  actionUrl?: string
  metadata?: any
}

export class NotificationService {
  /**
   * Creates an in-app notification
   */
  static async createNotification(options: CreateNotificationOptions) {
    const payload = await getPayload({ config: configPromise })

    const notification = await payload.create({
      collection: 'notifications',
      data: {
        user: options.userId,
        type: options.type,
        title: options.title,
        message: options.message,
        actionUrl: options.actionUrl,
        status: 'pending',
        metadata: options.metadata,
      }
    })

    // Fire and forget dispatch
    this.dispatch(notification.id).catch(e => {
        payload.logger.error(`Failed to dispatch notification ${notification.id}`, e)
    })

    return notification
  }

  /**
   * Internal dispatcher - for now just marks delivered,
   * but could send push notifications etc.
   */
  private static async dispatch(notificationId: string) {
    const payload = await getPayload({ config: configPromise })

    await payload.update({
        collection: 'notifications',
        id: notificationId,
        data: {
            status: 'delivered'
        }
    })
  }

  /**
   * Sends an email notification to the user
   */
  static async sendEmailNotification(userId: string, subject: string, html: string) {
    const payload = await getPayload({ config: configPromise })

    const user = await payload.findByID({
        collection: 'users',
        id: userId
    })

    if (!user || !user.email) {
        throw new Error('User not found or has no email')
    }

    try {
        await payload.sendEmail({
            to: user.email,
            from: env.FROM_EMAIL,
            subject,
            html,
        })
    } catch (e) {
        payload.logger.error({ err: e }, `Failed to send email to ${user.email}`)
        throw e
    }
  }
}
