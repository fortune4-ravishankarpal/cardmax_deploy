/**
 * markMigrationApplied.ts
 * 
 * Marks the `20260902_111236_phase2_schema_2` migration as already applied
 * in the payload_migrations table.
 *
 * This is needed because that migration is a full-schema snapshot that was
 * created while the DB was already current from dev-mode auto-sync.
 * Running it would fail with "already exists" errors.
 *
 * Run once with: pnpm tsx src/seed/markMigrationApplied.ts
 */
import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function main() {
  const payload = await getPayload({ config: configPromise })

  // Access the underlying drizzle db instance
  const db = (payload.db as any).drizzle

  // Check if migration already exists
  const existing = await db.execute(
    `SELECT id FROM payload_migrations WHERE name = '20260902_111236_phase2_schema_2' LIMIT 1`
  )

  if (existing.rows && existing.rows.length > 0) {
    payload.logger.info('Migration 20260902_111236_phase2_schema_2 already marked as applied.')
    process.exit(0)
  }

  import('crypto').then(async ({ randomUUID }) => {
    const id = randomUUID()
    await db.execute(
      `INSERT INTO payload_migrations (id, name, batch, updated_at, created_at)
       VALUES ('${id}', '20260902_111236_phase2_schema_2', 1, NOW(), NOW())`
    )
    payload.logger.info('Marked 20260902_111236_phase2_schema_2 as applied.')
    process.exit(0)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
