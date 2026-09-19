import { getPayload, type Payload } from 'payload'
import configPromise from '@payload-config'
import { env } from '../lib/env'
import type {
  NotificationEvent,
  NotificationChannel,
  NotificationEventType,
  PublishResult,
  ChannelPublishResult,
  DispatchOptions,
  NotificationTemplateVars,
} from './types'
import { NOTIFICATION_CHANNELS, EVENT_PREFERENCE_FIELD } from './types'
import { isEventProcessed } from './idempotency'

// ─── Backward-compat interface (used by existing tasks) ──────────────────────

export interface CreateNotificationOptions {
  userId: string
  type: 'system' | 'payment' | 'subscription' | 'alert'
  title: string
  message: string
  actionUrl?: string
  metadata?: any
}

// ─── Default code templates (fallback when no Admin template is found) ────────

const CODE_DEFAULTS: Record<NotificationEventType, NotificationTemplateVars> = {
  ANALYSIS_COMPLETED: {
    title: 'Statement Analysis Ready',
    body: 'Your CardMax analysis is ready. Tap to view your insights.',
    subject: 'Your CardMax statement analysis is ready',
  },
  DEVALUATION_DETECTED: {
    title: 'Card Devaluation Alert',
    body: 'A change was detected on one of your saved cards. Tap to review.',
    subject: 'CardMax: Card devaluation detected',
  },
  MILESTONE_ACHIEVED: {
    title: 'Milestone Reached! 🎉',
    body: 'You have hit a new milestone on your card rewards goal.',
    subject: 'Congratulations! Milestone achieved on CardMax',
  },
  FEE_WAIVER_ACHIEVED: {
    title: 'Annual Fee Waived!',
    body: 'You have hit the spend threshold. Your annual fee is waived.',
    subject: 'CardMax: Annual fee waiver achieved',
  },
  FEE_WAIVER_APPROACHING: {
    title: 'Fee Waiver Approaching',
    body: 'You are close to hitting your fee waiver threshold.',
    subject: 'CardMax: You are close to your fee waiver goal',
  },
  ELIGIBILITY_GRANTED: {
    title: 'Trial Activated',
    body: 'Your CardMax trial has been activated. Enjoy the full experience.',
    subject: 'Your CardMax trial is now active',
  },
  APPLICATION_STATUS_CHANGED: {
    title: 'Application Update',
    body: 'The status of your card application has been updated.',
    subject: 'CardMax: Your card application status has changed',
  },
  APPLICATION_FOLLOWUP: {
    title: 'Application Follow-Up',
    body: 'It is time to follow up on your card application.',
    subject: 'CardMax: Card application follow-up reminder',
  },
  ONBOARDING_COMPLETED: {
    title: 'Welcome to CardMax!',
    body: 'Your profile is complete. Start exploring your card rewards.',
    subject: 'Welcome to CardMax — your profile is ready',
  },
  MONTHLY_SUMMARY: {
    title: 'Your Monthly Summary',
    body: 'Your CardMax monthly rewards summary is ready.',
    subject: 'CardMax: Your monthly rewards summary',
  },
  PAYMENT_SUCCESS: {
    title: 'Payment Confirmed',
    body: 'Your CardMax subscription payment was successful.',
    subject: 'CardMax: Payment confirmed',
  },
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    body: 'Your CardMax subscription payment could not be processed. Please update your payment method.',
    subject: 'CardMax: Action needed — payment failed',
  },
  SUBSCRIPTION_STARTED: {
    title: 'Welcome to CardMax Pro!',
    body: 'Your CardMax Pro subscription is now active.',
    subject: 'CardMax Pro subscription activated',
  },
  SUBSCRIPTION_RENEWED: {
    title: 'Subscription Renewed',
    body: 'Your CardMax Pro subscription has been renewed successfully.',
    subject: 'CardMax Pro subscription renewed',
  },
  SUBSCRIPTION_EXPIRING: {
    title: 'Subscription Expiring Soon',
    body: 'Your CardMax Pro subscription is past due. Please update your payment method.',
    subject: 'CardMax: Subscription expiring — action required',
  },
  SUBSCRIPTION_CANCELLED: {
    title: 'Subscription Cancelled',
    body: 'Your CardMax Pro subscription has been cancelled.',
    subject: 'CardMax Pro subscription cancelled',
  },
}

// ─── Event Type → Notification type mapping ───────────────────────────────────

const EVENT_TYPE_MAP: Record<
  NotificationEventType,
  'system' | 'payment' | 'subscription' | 'alert' | 'statement' | 'application' | 'goal' | 'onboarding'
> = {
  ANALYSIS_COMPLETED: 'statement',
  DEVALUATION_DETECTED: 'alert',
  MILESTONE_ACHIEVED: 'goal',
  FEE_WAIVER_ACHIEVED: 'goal',
  FEE_WAIVER_APPROACHING: 'goal',
  ELIGIBILITY_GRANTED: 'system',
  APPLICATION_STATUS_CHANGED: 'application',
  APPLICATION_FOLLOWUP: 'application',
  ONBOARDING_COMPLETED: 'onboarding',
  MONTHLY_SUMMARY: 'system',
  PAYMENT_SUCCESS: 'payment',
  PAYMENT_FAILED: 'payment',
  SUBSCRIPTION_STARTED: 'subscription',
  SUBSCRIPTION_RENEWED: 'subscription',
  SUBSCRIPTION_EXPIRING: 'subscription',
  SUBSCRIPTION_CANCELLED: 'subscription',
}

// ─── Template interpolation ────────────────────────────────────────────────────

function interpolate(template: string, data: Record<string, unknown> = {}): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    data[key] !== undefined ? String(data[key]) : `{{${key}}}`,
  )
}

// ─── Main Service ─────────────────────────────────────────────────────────────

export class NotificationService {
  /**
   * Publish a notification event across all active channels.
   * Handles idempotency, preference checks, template resolution, and dispatch.
   *
   * @param event  The notification event to publish
   * @param payloadInstance  Optional pre-resolved Payload instance (from hooks)
   * @param options  Dispatch options
   */
  static async publishEvent(
    event: NotificationEvent,
    payloadInstance?: Payload,
    options: DispatchOptions = {},
  ): Promise<PublishResult> {
    const payload = payloadInstance ?? (await getPayload({ config: configPromise }))
    const { eventId, eventType, userId, data = {}, channels } = event

    // Determine group ID
    const notificationGroupId =
      options.notificationGroupId ?? `${eventType}_${userId}_${Date.now()}`

    // Fetch user preferences (with overrideAccess for system context)
    let user: any
    try {
      user = await payload.findByID({
        collection: 'users',
        id: userId,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      payload.logger.error({ eventId }, 'NotificationService: user not found, aborting')
      return { eventId, notificationGroupId, channels: [] }
    }

    const prefs = user?.notificationPreferences ?? {}
    const preferenceField = EVENT_PREFERENCE_FIELD[eventType]

    // Determine active channels (filtered by preferences)
    const targetChannels: NotificationChannel[] = (channels ?? [...NOTIFICATION_CHANNELS]).filter(
      (ch) => {
        if (options.ignorePreferences) return true

        // Topic preference check
        if (preferenceField && prefs[preferenceField] === false) return false

        // Channel master switch
        if ((ch === 'push_fcm' || ch === 'push_apns') && prefs.pushEnabled === false) return false
        if (ch === 'email' && prefs.emailEnabled === false) return false

        return true
      },
    )

    // Resolve template from Admin CMS (fallback to code defaults)
    const templates: Record<NotificationChannel, NotificationTemplateVars | null> = {
      in_app: null,
      push_fcm: null,
      push_apns: null,
      email: null,
    }

    try {
      const templateResults = await payload.find({
        collection: 'notification-templates',
        where: {
          and: [
            { eventType: { equals: eventType } },
            { isActive: { equals: true } },
          ],
        },
        depth: 0,
        overrideAccess: true,
      })
      for (const tmpl of templateResults.docs) {
        const ch = tmpl.channel as NotificationChannel
        templates[ch] = {
          id: String(tmpl.id),
          title: tmpl.title ?? '',
          body: tmpl.body ?? '',
          subject: (tmpl.subject as string) || undefined,
        }
      }
    } catch (e) {
      payload.logger.warn({ err: e }, 'NotificationService: failed to load templates, using code defaults')
    }

    // Dispatch to each channel
    const results: ChannelPublishResult[] = []

    for (const channel of targetChannels) {
      // Idempotency check
      const alreadyProcessed = await isEventProcessed(payload, eventId, channel)
      if (alreadyProcessed) {
        results.push({ channel, notificationId: '', status: 'duplicate' })
        continue
      }

      const tmplVars = templates[channel] ?? CODE_DEFAULTS[eventType]
      const title = interpolate(tmplVars.title, data)
      const body = interpolate(tmplVars.body, data)
      const notifType = EVENT_TYPE_MAP[eventType]
      const isSimulation = env.NOTIFICATION_MODE === 'simulation'

      try {
        // Create the delivery record
        const record = await payload.create({
          collection: 'notifications',
          data: {
            user: userId,
            eventId,
            notificationGroupId,
            channel,
            type: notifType,
            title,
            message: body,
            template: tmplVars.id,
            status: 'pending',
            metadata: isSimulation ? { mode: 'simulation' } : {},
          },
          overrideAccess: true,
        })

        // Dispatch by channel
        let finalStatus: 'delivered' | 'sent' | 'failed' = 'pending' as any

        if (channel === 'in_app') {
          finalStatus = 'delivered'
        } else if (channel === 'push_fcm' || channel === 'push_apns') {
          finalStatus = await NotificationService._dispatchPush(
            payload, userId, channel, title, body, record.id, isSimulation
          )
        } else if (channel === 'email') {
          finalStatus = await NotificationService._dispatchEmail(
            payload, user, eventType, tmplVars, data, record.id, isSimulation
          )
        }

        await payload.update({
          collection: 'notifications',
          id: record.id,
          data: {
            status: finalStatus,
            sentAt: new Date().toISOString(),
            deliveredAt: finalStatus === 'delivered' ? new Date().toISOString() : undefined,
          },
          overrideAccess: true,
        })

        results.push({ channel, notificationId: String(record.id), status: finalStatus === 'failed' ? 'failed' : 'delivered' })
      } catch (e: any) {
        payload.logger.error({ err: e, eventId, channel }, 'NotificationService: dispatch failed')
        results.push({ channel, notificationId: '', status: 'failed', error: e.message })
      }
    }

    return { eventId, notificationGroupId, channels: results }
  }

  /** Dispatch a push notification via PushService */
  private static async _dispatchPush(
    payload: Payload,
    userId: string,
    channel: 'push_fcm' | 'push_apns',
    title: string,
    body: string,
    notificationId: string,
    isSimulation: boolean,
  ): Promise<'delivered' | 'sent' | 'failed'> {
    try {
      const { PushService } = await import('./push/service')
      await PushService.send(payload, userId, { title, body }, isSimulation)
      return 'sent'
    } catch (e) {
      payload.logger.error({ err: e, userId, channel }, 'Push dispatch failed')
      return 'failed'
    }
  }

  /** Dispatch an email via EmailService */
  private static async _dispatchEmail(
    payload: Payload,
    user: any,
    eventType: NotificationEventType,
    tmplVars: NotificationTemplateVars,
    data: Record<string, unknown>,
    notificationId: string,
    isSimulation: boolean,
  ): Promise<'delivered' | 'sent' | 'failed'> {
    try {
      const { EmailService } = await import('./email/service')
      const subject = interpolate(tmplVars.subject || tmplVars.title, data)
      const html = tmplVars.html ? interpolate(tmplVars.html, data) : `<p>${interpolate(tmplVars.body, data)}</p>`

      await EmailService.send({
        to: user.email,
        subject,
        html,
        isSimulation,
      })
      return isSimulation ? 'delivered' : 'sent'
    } catch (e) {
      payload.logger.error({ err: e, userId: user.id }, 'Email dispatch failed')
      return 'failed'
    }
  }

  // ─── Backward-compatible API (used by existing sendNotification task) ────────

  /**
   * Creates an in-app notification (legacy API, preserved for backward compat).
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
        channel: 'in_app',
        status: 'pending',
        metadata: options.metadata,
      },
      overrideAccess: true,
    })

    // Mark delivered immediately for in-app
    this._markDelivered(payload, String(notification.id)).catch((e) =>
      payload.logger.error(`Failed to mark notification ${notification.id} delivered`, e),
    )

    return notification
  }

  private static async _markDelivered(payload: Payload, id: string) {
    await payload.update({
      collection: 'notifications',
      id,
      data: { status: 'delivered', deliveredAt: new Date().toISOString() },
      overrideAccess: true,
    })
  }

  /**
   * Sends a raw email (legacy API, preserved for backward compat).
   */
  static async sendEmailNotification(userId: string, subject: string, html: string) {
    const payload = await getPayload({ config: configPromise })

    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      overrideAccess: true,
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
