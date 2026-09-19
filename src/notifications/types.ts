/**
 * Notification System – Core Types (8.18 & 8.19)
 *
 * Defines the event-driven notification contract used across CardMax.
 * All notification work starts with a `NotificationEvent` passed to
 * `NotificationService.publishEvent()`.
 */

// ─── Event Types ────────────────────────────────────────────────────────────

export const NOTIFICATION_EVENT_TYPES = [
  'ANALYSIS_COMPLETED',
  'DEVALUATION_DETECTED',
  'MILESTONE_ACHIEVED',
  'FEE_WAIVER_ACHIEVED',
  'FEE_WAIVER_APPROACHING',
  'ELIGIBILITY_GRANTED',
  'APPLICATION_STATUS_CHANGED',
  'APPLICATION_FOLLOWUP',
  'ONBOARDING_COMPLETED',
  'MONTHLY_SUMMARY',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'SUBSCRIPTION_STARTED',
  'SUBSCRIPTION_RENEWED',
  'SUBSCRIPTION_EXPIRING',
  'SUBSCRIPTION_CANCELLED',
] as const

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number]

// ─── Channels ────────────────────────────────────────────────────────────────

export const NOTIFICATION_CHANNELS = ['in_app', 'push_fcm', 'push_apns', 'email'] as const
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number]

// ─── Topic → Preference Field mapping ────────────────────────────────────────

/**
 * Maps an event type to the user preference field that controls it.
 * If the field is `null`, the event is always delivered (system events).
 */
export const EVENT_PREFERENCE_FIELD: Record<
  NotificationEventType,
  string | null
> = {
  ANALYSIS_COMPLETED: 'analysisResults',
  DEVALUATION_DETECTED: 'devaluationAlerts',
  MILESTONE_ACHIEVED: 'milestoneAlerts',
  FEE_WAIVER_ACHIEVED: 'feeWaiverAlerts',
  FEE_WAIVER_APPROACHING: 'feeWaiverAlerts',
  ELIGIBILITY_GRANTED: 'eligibilityAlerts',
  APPLICATION_STATUS_CHANGED: 'applicationUpdates',
  APPLICATION_FOLLOWUP: 'applicationUpdates',
  ONBOARDING_COMPLETED: null, // always send
  MONTHLY_SUMMARY: 'monthlySummaryEmails',
  PAYMENT_SUCCESS: 'paymentUpdates',
  PAYMENT_FAILED: 'paymentUpdates',
  SUBSCRIPTION_STARTED: 'subscriptionUpdates',
  SUBSCRIPTION_RENEWED: 'subscriptionUpdates',
  SUBSCRIPTION_EXPIRING: 'subscriptionUpdates',
  SUBSCRIPTION_CANCELLED: 'subscriptionUpdates',
}

// ─── Event Payload ────────────────────────────────────────────────────────────

export interface NotificationEvent {
  /** Globally unique identifier for this event occurrence.
   *  Used for idempotency — same eventId+channel = no duplicate delivery.
   *  Convention: `{eventType}_{relatedDocId}_{unixMs}` */
  eventId: string

  /** Which event triggered this notification */
  eventType: NotificationEventType

  /** The Payload user ID that should receive the notification */
  userId: string

  /** Channels to deliver to. If omitted, defaults to all active channels
   *  based on user preferences. */
  channels?: NotificationChannel[]

  /** Event-specific data used for template variable substitution.
   *  Must NEVER contain PAN, raw card numbers, or full account numbers. */
  data?: Record<string, unknown>
}

// ─── Template & Rendering ────────────────────────────────────────────────────

export interface NotificationTemplateVars {
  id?: string
  title: string
  body: string
  subject?: string   // email only
  html?: string      // email only
}

// ─── Dispatch Options ────────────────────────────────────────────────────────

export interface DispatchOptions {
  /** Explicit group ID; generated deterministically if not provided */
  notificationGroupId?: string
  /** Skip the user preference check (for critical system messages) */
  ignorePreferences?: boolean
}

// ─── Result ──────────────────────────────────────────────────────────────────

export interface ChannelPublishResult {
  channel: NotificationChannel
  notificationId: string
  status: 'delivered' | 'failed' | 'suppressed' | 'duplicate'
  error?: string
}

export interface PublishResult {
  eventId: string
  notificationGroupId: string
  channels: ChannelPublishResult[]
}
