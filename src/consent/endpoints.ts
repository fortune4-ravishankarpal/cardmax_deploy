import { Endpoint } from 'payload'
import { ConsentService } from './service'
import { getGmailConnectionStatus } from '@/auth/gmail/tokens'
import { CURRENT_TOS_VERSION, CURRENT_PRIVACY_VERSION } from '@/lib/consentVersions'

const ACTIVE_PURPOSES = ['analyse_inbox', 'persist_derived'] as const

export const consentEndpoints: Endpoint[] = [
  {
    path: '/consent/summary',
    method: 'get',
    handler: async (req) => {
      try {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await req.payload.findByID({
          collection: 'users',
          id: req.user.id,
          depth: 0,
          overrideAccess: true,
        })

        const allConsents = await ConsentService.getAllConsents(req.user.id)
        const consentMap: Record<string, 'granted' | 'revoked' | 'not_set'> = {
          analyse_inbox: 'not_set',
          persist_derived: 'not_set',
        }

        for (const c of allConsents) {
          const purpose = (c as any).purpose
          const status = (c as any).status
          if (purpose in consentMap) {
            consentMap[purpose] = status === 'granted' ? 'granted' : 'revoked'
          }
        }

        const gmailStatus = await getGmailConnectionStatus(req.payload, req.user.id as any)

        return Response.json({
          consents: consentMap,
          marketing: Boolean((user as any).marketingConsent),
          gmailConnected: gmailStatus.connected,
          gmailAddress: gmailStatus.gmailAddress,
          gmailConnectedAt: gmailStatus.connectedAt,
          legalVersions: {
            tosVersion: (user as any).tosVersion || null,
            acceptedTermsAt: (user as any).acceptedTermsAt || null,
            privacyNoticeVersion: (user as any).privacyNoticeVersion || null,
            acknowledgedPrivacyAt: (user as any).acknowledgedPrivacyAt || null,
          },
        })
      } catch (error) {
        req.payload.logger.error({ msg: 'Error getting consent summary', error })
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
      }
    },
  },
  {
    path: '/consent/acknowledge-policy',
    method: 'post',
    handler: async (req) => {
      try {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const now = new Date().toISOString()
        await req.payload.update({
          collection: 'users',
          id: req.user.id,
          data: {
            tosVersion: CURRENT_TOS_VERSION,
            acceptedTermsAt: now,
            privacyNoticeVersion: CURRENT_PRIVACY_VERSION,
            acknowledgedPrivacyAt: now,
          },
          overrideAccess: true,
          depth: 0,
        })

        return Response.json({
          success: true,
          tosVersion: CURRENT_TOS_VERSION,
          privacyNoticeVersion: CURRENT_PRIVACY_VERSION,
        })
      } catch (error) {
        req.payload.logger.error({ msg: 'Error acknowledging updated policy', error })
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
      }
    },
  },
  {
    path: '/consent/marketing',
    method: 'post',
    handler: async (req) => {
      try {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = req.json ? await req.json() : (req as any).body
        const marketing = Boolean(body?.marketing)

        await req.payload.update({
          collection: 'users',
          id: req.user.id,
          data: {
            marketingConsent: marketing,
            marketingConsentAt: new Date().toISOString(),
          },
          overrideAccess: true,
          depth: 0,
        })

        return Response.json({ success: true, marketing })
      } catch (error) {
        req.payload.logger.error({ msg: 'Error updating marketing consent', error })
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
      }
    },
  },
  {
    path: '/consent',
    method: 'post',
    handler: async (req) => {
      try {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = req.json ? await req.json() : (req as any).body
        const { action, purpose, version, source } = body

        if (!action || !purpose) {
          return Response.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Validate that purpose is in active purposes list (decision #2: don't allow inactive placeholders)
        if (!ACTIVE_PURPOSES.includes(purpose as any)) {
          return Response.json(
            { error: `Purpose '${purpose}' is not currently active or supported for consent.` },
            { status: 400 },
          )
        }

        const effectiveVersion = version || CURRENT_PRIVACY_VERSION

        const options = {
          userId: req.user.id as string | number,
          purpose,
          version: effectiveVersion,
          source: source || 'settings_page',
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        }

        let result
        if (action === 'grant') {
          result = await ConsentService.grant(options)
        } else if (action === 'revoke') {
          result = await ConsentService.revoke(options)
        } else {
          return Response.json({ error: 'Invalid action' }, { status: 400 })
        }

        return Response.json({ success: true, consent: result })
      } catch (error) {
        req.payload.logger.error({ msg: 'Error processing consent action', error })
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
      }
    },
  },
  {
    path: '/consent/:purpose',
    method: 'get',
    handler: async (req) => {
      try {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const pathSegments = (req.url || '').split('?')[0].split('/')
        const purpose = pathSegments[pathSegments.length - 1]

        const hasConsent = await ConsentService.hasConsent(req.user.id as string | number, purpose)

        return Response.json({ hasConsent })
      } catch (error) {
        req.payload.logger.error({ msg: 'Error checking consent', error })
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
      }
    },
  },
]
