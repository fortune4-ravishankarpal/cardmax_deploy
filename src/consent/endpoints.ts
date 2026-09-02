import { Endpoint } from 'payload'
import { ConsentService } from './service'

export const consentEndpoints: Endpoint[] = [
  {
    path: '/consent',
    method: 'post',
    handler: async (req) => {
      try {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // We use req.json() to parse the body as standard NextJS requests are wrapped
        const body = req.json ? await req.json() : (req as any).body
        const { action, purpose, version, source } = body

        if (!action || !purpose || !version) {
          return Response.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const options = {
          userId: req.user.id as string,
          purpose,
          version,
          source,
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        }

        let result;
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
    }
  },
  {
    path: '/consent/:purpose',
    method: 'get',
    handler: async (req) => {
      try {
        if (!req.user || req.user.collection !== 'users') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // For endpoints defined in a collection context (e.g. users collection), 
        // path parameters aren't automatically parsed into req.query/req.params the same way
        // Let's grab it manually from the URL path.
        const pathSegments = req.url.split('?')[0].split('/');
        const purpose = pathSegments[pathSegments.length - 1]; // This gives us :purpose

        const hasConsent = await ConsentService.hasConsent(req.user.id as string, purpose)

        return Response.json({ hasConsent })
      } catch (error) {
        req.payload.logger.error({ msg: 'Error checking consent', error })
        return Response.json({ error: 'Internal Server Error' }, { status: 500 })
      }
    }
  }
]
