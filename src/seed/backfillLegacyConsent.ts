/**
 * backfillLegacyConsent.ts
 *
 * One-time data migration script for existing users created before the
 * versioned consent system was introduced.
 *
 * Run with:
 *   pnpm tsx src/seed/backfillLegacyConsent.ts
 *
 * What this script does:
 *
 * 1. Users with acceptedTermsAndConditions = true:
 *    → tosVersion = 'legacy', acceptedTermsAt = null
 *    We know acceptance occurred but not when or to which version.
 *    The 'legacy' sentinel preserves the fact of acceptance without
 *    fabricating a timestamp.
 *
 * 2. Users with acceptedPrivacyPolicy = true:
 *    → privacyNoticeVersion = 'legacy', acknowledgedPrivacyAt = null
 *    Same reasoning as above.
 *
 * 3. All users:
 *    → marketingConsent = false (safe default — we have no evidence of opt-in)
 *    Users can opt in via the profile settings page.
 *
 * 4. Users with an active gmail-connections record but no analyse_inbox
 *    consent record:
 *    → Create consents: analyse_inbox = granted, version = 'legacy',
 *      source = 'legacy_migration', grantedAt = connectedAt
 *    We do NOT create persist_derived consent for legacy users — we cannot
 *    know whether they were informed that derived data would be stored.
 *    Their existing statement records are preserved (per retention policy).
 *    Future statement persistence requires an explicit grant.
 *
 * IMPORTANT: This script is idempotent — re-running it is safe.
 * It skips users that already have tosVersion / privacyNoticeVersion set.
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { LEGACY_VERSION_SENTINEL } from '../lib/consentVersions'

async function main() {
  const payload = await getPayload({ config: configPromise })

  payload.logger.info('=== Backfill: Legacy Consent Migration ===')

  // ──────────────────────────────────────────────────────────────────────────
  // Step 1 & 2: Users with boolean T&C / Privacy acceptance but no version
  // ──────────────────────────────────────────────────────────────────────────

  let page = 1
  let hasMore = true
  let tosUpdated = 0
  let privacyUpdated = 0

  payload.logger.info('Step 1/2: Backfilling T&C and Privacy Notice versions...')

  while (hasMore) {
    const result = await payload.find({
      collection: 'users',
      page,
      limit: 100,
      where: {
        and: [
          // Only process users that don't already have a version set
          { tosVersion: { exists: false } },
        ],
      },
      depth: 0,
      overrideAccess: true,
    })

    for (const user of result.docs) {
      const updateData: Record<string, unknown> = {}

      // T&C: was accepted (legacy boolean) but no version recorded
      if ((user as any).acceptedTermsAndConditions === true && !(user as any).tosVersion) {
        updateData.tosVersion = LEGACY_VERSION_SENTINEL
        updateData.acceptedTermsAt = null // timestamp unknown — do NOT fabricate
        tosUpdated++
      }

      // Privacy: was accepted (legacy boolean) but no version recorded
      if ((user as any).acceptedPrivacyPolicy === true && !(user as any).privacyNoticeVersion) {
        updateData.privacyNoticeVersion = LEGACY_VERSION_SENTINEL
        updateData.acknowledgedPrivacyAt = null // timestamp unknown — do NOT fabricate
        privacyUpdated++
      }

      // Marketing: default to false for all existing users (safe default)
      if ((user as any).marketingConsent === undefined || (user as any).marketingConsent === null) {
        updateData.marketingConsent = false
      }

      if (Object.keys(updateData).length > 0) {
        await payload.update({
          collection: 'users',
          id: user.id,
          data: updateData,
          overrideAccess: true,
          depth: 0,
        })
      }
    }

    hasMore = result.hasNextPage
    page++
  }

  payload.logger.info(`  → T&C version backfilled for ${tosUpdated} users`)
  payload.logger.info(`  → Privacy Notice version backfilled for ${privacyUpdated} users`)

  // ──────────────────────────────────────────────────────────────────────────
  // Step 3: Gmail users — create analyse_inbox consent if missing
  // ──────────────────────────────────────────────────────────────────────────

  payload.logger.info('Step 3: Backfilling analyse_inbox consent for existing Gmail users...')

  let gmailPage = 1
  let gmailHasMore = true
  let gmailConsentCreated = 0

  while (gmailHasMore) {
    const gmailConns = await payload.find({
      collection: 'gmail-connections',
      page: gmailPage,
      limit: 100,
      where: { status: { equals: 'active' } },
      depth: 0,
      overrideAccess: true,
    })

    for (const conn of gmailConns.docs) {
      const userId = typeof (conn as any).user === 'object'
        ? (conn as any).user?.id
        : (conn as any).user

      if (!userId) continue

      // Check whether a consent record for analyse_inbox already exists
      const existing = await payload.find({
        collection: 'consents',
        where: {
          and: [
            { user: { equals: userId } },
            { purpose: { equals: 'analyse_inbox' } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })

      if (existing.docs.length > 0) {
        // Already has a record — skip
        continue
      }

      // Create the consent record
      await payload.create({
        collection: 'consents',
        data: {
          user: userId,
          purpose: 'analyse_inbox',
          status: 'granted',
          version: LEGACY_VERSION_SENTINEL,
          source: 'legacy_migration',
          grantedAt: (conn as any).connectedAt || new Date().toISOString(),
        },
        overrideAccess: true,
      })

      // Create a corresponding consent event for the audit trail
      await payload.create({
        collection: 'consent-events',
        data: {
          user: userId,
          purpose: 'analyse_inbox',
          action: 'grant',
          version: LEGACY_VERSION_SENTINEL,
          source: 'legacy_migration',
          // No IP or userAgent — we do not have them for historical connections
        },
        overrideAccess: true,
      })

      gmailConsentCreated++
    }

    gmailHasMore = gmailConns.hasNextPage
    gmailPage++
  }

  payload.logger.info(`  → analyse_inbox consent created for ${gmailConsentCreated} legacy Gmail users`)
  payload.logger.info('=== Backfill complete ===')

  process.exit(0)
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
