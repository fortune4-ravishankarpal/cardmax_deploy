import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * Checks if a feature flag is enabled in the database.
 * Falls back to false if the flag doesn't exist or on error.
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  try {
    const payload = await getPayload({ config: configPromise })
    
    const flags = await payload.find({
      collection: 'feature-flags',
      where: {
        key: {
          equals: key
        }
      },
      limit: 1,
    })

    if (flags.docs.length > 0) {
      return Boolean(flags.docs[0].enabled)
    }

    return false
  } catch (error) {
    console.error(`Error checking feature flag ${key}:`, error)
    return false
  }
}
