/**
 * PushService
 *
 * Resolves active device tokens for a user in the current environment,
 * enforces push security (no sensitive data), and routes Android → FCM,
 * iOS → APNs.
 */
import type { Payload } from 'payload'
import type { PushMessage } from './types'
import { sendFcmNotification } from './fcm'
import { sendApnsNotification } from './apns'

// Patterns that should NEVER appear in a push notification
const SENSITIVE_PATTERNS = [
  /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Card number (16 digits)
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,                 // Indian PAN
  /₹\s?\d[\d,]+/,                              // Rupee amount — strip, not block
  /\bINR\s?\d[\d,]+/,                           // INR amount
]

function assertPushSecurity(message: PushMessage): void {
  const textToCheck = `${message.title} ${message.body}`
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(textToCheck)) {
      throw new Error(
        `[PushSecurity] Push notification contains potentially sensitive data matching pattern ${pattern}. ` +
        'Use generic call-to-action text only.',
      )
    }
  }
}

/** Resolve the current app environment (maps NODE_ENV to token environment) */
function getAppEnvironment(): 'development' | 'staging' | 'production' {
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === 'production') return 'production'
  if (process.env.APP_ENV === 'staging') return 'staging'
  return 'development'
}

export class PushService {
  /**
   * Send a push notification to all active devices for the given user.
   * Automatically routes by platform (Android → FCM, iOS → APNs).
   */
  static async send(
    payload: Payload,
    userId: string,
    message: PushMessage,
    isSimulation: boolean,
  ): Promise<void> {
    // Security check — will throw if sensitive data is detected
    assertPushSecurity(message)

    const environment = getAppEnvironment()

    // Fetch active device tokens for this user and environment
    const tokenResult = await payload.find({
      collection: 'device-tokens',
      where: {
        and: [
          { user: { equals: userId } },
          { isActive: { equals: true } },
          { environment: { equals: environment } },
        ],
      },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    })

    if (tokenResult.totalDocs === 0) {
      payload.logger.debug({ userId, environment }, '[PushService] No active device tokens found')
      return
    }

    for (const tokenDoc of tokenResult.docs) {
      const tokenId = String(tokenDoc.id)
      const token = tokenDoc.token as string
      const provider = tokenDoc.provider as string

      if (provider === 'fcm') {
        await sendFcmNotification(payload, token, tokenId, message, isSimulation)
      } else if (provider === 'apns') {
        await sendApnsNotification(payload, token, tokenId, message, isSimulation)
      }
    }
  }
}
