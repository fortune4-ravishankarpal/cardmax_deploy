import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface ConsentActionOptions {
  userId: string | number
  purpose: 'analyse_inbox' | 'persist_derived' | 'improve_merchants'
  version: string
  source?: string
  ipAddress?: string
  userAgent?: string
}

export class ConsentService {
  /**
   * Get all consent records for a user
   */
  static async getAllConsents(userId: string | number) {
    const payload = await getPayload({ config: configPromise })
    const consents = await payload.find({
      collection: 'consents',
      where: {
        user: {
          equals: userId,
        },
      },
      limit: 100,
      overrideAccess: true,
      depth: 0,
    })
    return consents.docs
  }

  /**
   * Check if a user currently has active consent for a given purpose
   */
  static async hasConsent(userId: string | number, purpose: string): Promise<boolean> {
    const payload = await getPayload({ config: configPromise })
    
    const consents = await payload.find({
      collection: 'consents',
      where: {
        and: [
          {
            user: {
              equals: userId
            }
          },
          {
            purpose: {
              equals: purpose
            }
          },
          {
            status: {
              equals: 'granted'
            }
          }
        ]
      },
      limit: 1,
    })

    return consents.docs.length > 0
  }

  /**
   * Get the current consent state for a user and purpose
   */
  static async getState(userId: string | number, purpose: string) {
    const payload = await getPayload({ config: configPromise })
    
    const consents = await payload.find({
      collection: 'consents',
      where: {
        and: [
          {
            user: {
              equals: userId
            }
          },
          {
            purpose: {
              equals: purpose
            }
          }
        ]
      },
      limit: 1,
    })

    if (consents.docs.length === 0) {
      return null
    }

    return consents.docs[0]
  }

  /**
   * Grant consent for a given purpose
   */
  static async grant(options: ConsentActionOptions) {
    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()
    
    const existing = await this.getState(options.userId, options.purpose)

    let consentDoc;
    if (existing) {
      consentDoc = await payload.update({
        collection: 'consents',
        id: existing.id,
        data: {
          status: 'granted',
          version: options.version,
          grantedAt: now,
          revokedAt: null,
          source: options.source,
        }
      })
    } else {
      consentDoc = await payload.create({
        collection: 'consents',
        data: {
          user: options.userId as any,
          purpose: options.purpose,
          status: 'granted',
          version: options.version,
          grantedAt: now,
          source: options.source,
        },
      })
    }

    await payload.create({
      collection: 'consent-events',
      data: {
        user: options.userId as any,
        purpose: options.purpose,
        action: 'grant',
        version: options.version,
        source: options.source,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    })

    return consentDoc
  }

  /**
   * Revoke consent for a given purpose
   */
  static async revoke(options: ConsentActionOptions) {
    const payload = await getPayload({ config: configPromise })
    const now = new Date().toISOString()
    
    const existing = await this.getState(options.userId, options.purpose)

    let consentDoc;
    if (existing) {
      consentDoc = await payload.update({
        collection: 'consents',
        id: existing.id,
        data: {
          status: 'revoked',
          version: options.version,
          revokedAt: now,
          source: options.source,
        },
      })
    } else {
        // Technically shouldn't happen that they revoke before granting, but just in case
        consentDoc = await payload.create({
            collection: 'consents',
            data: {
              user: options.userId as any,
              purpose: options.purpose,
              status: 'revoked',
              version: options.version,
              revokedAt: now,
              source: options.source,
            },
        })
    }

    await payload.create({
      collection: 'consent-events',
      data: {
        user: options.userId as any,
        purpose: options.purpose,
        action: 'revoke',
        version: options.version,
        source: options.source,
        ipAddress: options.ipAddress,
        userAgent: options.userAgent,
      },
    })

    return consentDoc
  }
}
