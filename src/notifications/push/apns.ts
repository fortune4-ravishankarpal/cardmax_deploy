/**
 * APNs Push Adapter
 *
 * Uses the `apn` package (optional peer dependency) to send Apple Push
 * Notifications via HTTP/2. Falls back to simulation when credentials
 * are absent or the package is not installed.
 *
 * HTTP 410 (Unregistered) → automatically deactivates the token
 * in the DeviceTokens collection.
 */
import type { Payload } from 'payload'
import { env } from '../../lib/env'
import type { PushMessage, PushSendResult } from './types'

let _apnProvider: any = null

async function getApnProvider() {
  if (_apnProvider) return _apnProvider

  if (!env.APNS_KEY_ID || !env.APNS_TEAM_ID || !env.APNS_KEY || !env.APNS_TOPIC) {
    return null
  }

  try {
    // @ts-ignore
    const apn = await import('apn')
    _apnProvider = new apn.Provider({
      token: {
        key: env.APNS_KEY.replace(/\\n/g, '\n'),
        keyId: env.APNS_KEY_ID,
        teamId: env.APNS_TEAM_ID,
      },
      production: process.env.NODE_ENV === 'production',
    })
    return _apnProvider
  } catch {
    return null
  }
}

export async function sendApnsNotification(
  payload: Payload,
  deviceToken: string,
  deviceTokenId: string,
  message: PushMessage,
  isSimulation: boolean,
): Promise<PushSendResult> {
  if (isSimulation) {
    payload.logger.info(
      { deviceToken: deviceToken.slice(0, 12) + '…', message },
      '[APNs SIMULATION] Push notification preview',
    )
    return { success: true, messageId: `sim_apns_${Date.now()}` }
  }

  const provider = await getApnProvider()
  if (!provider) {
    payload.logger.warn('[APNs] apn provider not configured, falling back to simulation')
    return { success: true, messageId: `fallback_apns_${Date.now()}` }
  }

  try {
    // @ts-ignore
    const apn = await import('apn')
    const notification = new apn.Notification()
    notification.alert = { title: message.title, body: message.body }
    notification.topic = env.APNS_TOPIC!
    notification.sound = 'default'
    if (message.actionUrl) {
      notification.payload = { actionUrl: message.actionUrl }
    }

    const result = await provider.send(notification, deviceToken)

    if (result.failed && result.failed.length > 0) {
      const failure = result.failed[0]
      const isInvalidToken =
        failure.status === '410' ||
        failure.response?.reason === 'Unregistered' ||
        failure.response?.reason === 'BadDeviceToken'

      if (isInvalidToken && deviceTokenId) {
        try {
          await payload.update({
            collection: 'device-tokens',
            id: deviceTokenId,
            data: { isActive: false },
            overrideAccess: true,
          })
          payload.logger.info({ deviceTokenId }, '[APNs] Deactivated invalid device token')
        } catch {
          // Non-critical
        }
      }

      return {
        success: false,
        error: failure.response?.reason || 'APNs delivery failed',
        tokenDeactivated: isInvalidToken,
      }
    }

    return { success: true, messageId: result.sent?.[0] }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
