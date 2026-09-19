/**
 * FCM Push Adapter
 *
 * Uses firebase-admin (optional peer dependency) to send FCM messages.
 * In simulation mode or when credentials are absent, logs a preview
 * and returns a simulated success — zero network calls.
 *
 * On UNREGISTERED / INVALID_ARGUMENT errors, deactivates the token
 * in the DeviceTokens collection automatically.
 */
import type { Payload } from 'payload'
import { env } from '../../lib/env'
import type { PushMessage, PushSendResult } from './types'

let _app: any = null

async function loadFirebaseAdmin(): Promise<any> {
  try {
    // Evaluated dynamically at runtime to prevent bundler from tracing missing optional peer dependency
    const dynamicImport = new Function('pkg', 'return import(pkg)')
    const admin = await dynamicImport('firebase-admin')
    return admin?.default || admin
  } catch {
    return null
  }
}

async function getFcmApp() {
  if (_app) return _app

  if (!env.FCM_PROJECT_ID || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
    return null
  }

  try {
    const admin = await loadFirebaseAdmin()
    if (!admin) return null

    if (!admin.apps?.length) {
      _app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FCM_PROJECT_ID,
          clientEmail: env.FCM_CLIENT_EMAIL,
          privateKey: env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      })
    } else {
      _app = admin.apps[0]
    }
    return _app
  } catch {
    return null
  }
}

export async function sendFcmNotification(
  payload: Payload,
  deviceToken: string,
  deviceTokenId: string,
  message: PushMessage,
  isSimulation: boolean,
): Promise<PushSendResult> {
  if (isSimulation) {
    payload.logger.info(
      { deviceToken: deviceToken.slice(0, 12) + '…', message },
      '[FCM SIMULATION] Push notification preview',
    )
    return { success: true, messageId: `sim_${Date.now()}` }
  }

  const app = await getFcmApp()
  if (!app) {
    payload.logger.warn('[FCM] firebase-admin not configured, falling back to simulation')
    return { success: true, messageId: `fallback_${Date.now()}` }
  }

  try {
    const admin = await loadFirebaseAdmin()
    if (!admin) {
      return { success: true, messageId: `fallback_${Date.now()}` }
    }
    const messaging = admin.messaging(app)
    const messageId = await messaging.send({
      token: deviceToken,
      notification: {
        title: message.title,
        body: message.body,
      },
      data: message.actionUrl ? { actionUrl: message.actionUrl } : undefined,
      android: { priority: 'high' },
    })

    return { success: true, messageId }
  } catch (e: any) {
    const errCode = e?.errorInfo?.code || e?.code || ''
    const isInvalidToken =
      errCode.includes('UNREGISTERED') ||
      errCode.includes('INVALID_ARGUMENT') ||
      errCode.includes('registration-token-not-registered')

    if (isInvalidToken && deviceTokenId) {
      try {
        await payload.update({
          collection: 'device-tokens',
          id: deviceTokenId,
          data: { isActive: false },
          overrideAccess: true,
        })
        payload.logger.info({ deviceTokenId }, '[FCM] Deactivated invalid device token')
      } catch {
        // Non-critical
      }
    }

    return { success: false, error: e.message, tokenDeactivated: isInvalidToken }
  }
}
