import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: add_consent_audit_fields
 *
 * Adds legal-acceptance versioning and marketing consent fields to the
 * users table, a source column to the consents table, and enables
 * timestamps (created_at / updated_at) on consents and consent_events.
 *
 * The DB schema has already been applied by dev-mode auto-sync.
 * This migration exists so that production deployments get the same
 * schema changes deterministically without relying on dev mode.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Users: legal acceptance audit columns
    ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "tos_version"            varchar,
      ADD COLUMN IF NOT EXISTS "accepted_terms_at"      timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "privacy_notice_version" varchar,
      ADD COLUMN IF NOT EXISTS "acknowledged_privacy_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "marketing_consent"      boolean DEFAULT false NOT NULL,
      ADD COLUMN IF NOT EXISTS "marketing_consent_at"   timestamp(3) with time zone;

    -- Consents: source of the consent action + timestamps
    ALTER TABLE "consents"
      ADD COLUMN IF NOT EXISTS "source"      varchar,
      ADD COLUMN IF NOT EXISTS "updated_at"  timestamp(3) with time zone DEFAULT now() NOT NULL,
      ADD COLUMN IF NOT EXISTS "created_at"  timestamp(3) with time zone DEFAULT now() NOT NULL;

    -- Consent events: timestamps
    ALTER TABLE "consent_events"
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL;

    -- Indexes for the new timestamp columns
    CREATE INDEX IF NOT EXISTS "consents_updated_at_idx"       ON "consents"       USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "consents_created_at_idx"       ON "consents"       USING btree ("created_at");
    CREATE INDEX IF NOT EXISTS "consent_events_updated_at_idx" ON "consent_events" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "consent_events_created_at_idx" ON "consent_events" USING btree ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Remove indexes first
    DROP INDEX IF EXISTS "consents_updated_at_idx";
    DROP INDEX IF EXISTS "consents_created_at_idx";
    DROP INDEX IF EXISTS "consent_events_updated_at_idx";
    DROP INDEX IF EXISTS "consent_events_created_at_idx";

    -- Remove consent_events timestamps
    ALTER TABLE "consent_events"
      DROP COLUMN IF EXISTS "updated_at",
      DROP COLUMN IF EXISTS "created_at";

    -- Remove consents source + timestamps
    ALTER TABLE "consents"
      DROP COLUMN IF EXISTS "source",
      DROP COLUMN IF EXISTS "updated_at",
      DROP COLUMN IF EXISTS "created_at";

    -- Remove users audit columns
    ALTER TABLE "users"
      DROP COLUMN IF EXISTS "tos_version",
      DROP COLUMN IF EXISTS "accepted_terms_at",
      DROP COLUMN IF EXISTS "privacy_notice_version",
      DROP COLUMN IF EXISTS "acknowledged_privacy_at",
      DROP COLUMN IF EXISTS "marketing_consent",
      DROP COLUMN IF EXISTS "marketing_consent_at";
  `)
}
