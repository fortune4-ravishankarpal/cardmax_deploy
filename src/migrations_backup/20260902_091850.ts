import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_consents_purpose" AS ENUM('analyse_inbox', 'persist_derived', 'improve_merchants');
  CREATE TYPE "public"."enum_consents_status" AS ENUM('granted', 'revoked');
  CREATE TYPE "public"."enum_consent_events_action" AS ENUM('grant', 'revoke', 'notify');
  CREATE TYPE "public"."enum_user_cards_status" AS ENUM('active', 'deactivated', 'closed');
  CREATE TYPE "public"."enum_subscription_plans_billing_interval" AS ENUM('monthly', 'yearly');
  CREATE TYPE "public"."enum_subscriptions_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'expired', 'halted', 'pending', 'created', 'authenticated');
  CREATE TYPE "public"."enum_subscription_payments_status" AS ENUM('authorized', 'captured', 'failed', 'refunded');
  CREATE TYPE "public"."enum_provider_events_status" AS ENUM('pending', 'processing', 'processed', 'failed', 'ignored');
  CREATE TYPE "public"."enum_subscription_events_event_type" AS ENUM('created', 'activated', 'renewed', 'grace_period_started', 'grace_period_ended', 'canceled', 'expired', 'halted');
  CREATE TYPE "public"."enum_notifications_type" AS ENUM('system', 'payment', 'subscription', 'alert');
  CREATE TYPE "public"."enum_notifications_status" AS ENUM('pending', 'delivered', 'failed');
  CREATE TYPE "public"."enum_max_pro_events_event_type" AS ENUM('devaluation_detected', 'target_spend_insight', 'missing_card_warning', 'weekly_summary');
  CREATE TYPE "public"."enum_max_pro_events_status" AS ENUM('generated', 'notified', 'dismissed', 'acted_upon');
  CREATE TYPE "public"."enum_max_pro_events_priority" AS ENUM('low', 'medium', 'high', 'critical');
  CREATE TYPE "public"."enum_user_goals_type" AS ENUM('fee_waiver', 'milestone_bonus', 'reward_target');
  CREATE TYPE "public"."enum_user_goals_status" AS ENUM('active', 'achieved', 'failed', 'abandoned');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'processProviderEvent', 'expireSubscriptions', 'reconcileSubscriptions', 'sendNotification', 'fanoutDevaluation');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'processProviderEvent', 'expireSubscriptions', 'reconcileSubscriptions', 'sendNotification', 'fanoutDevaluation');
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'feature-flags.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'feature-flags.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'feature-flags.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'feature-flags.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'feature-flags.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'feature-flags.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consents.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consents.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consents.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consents.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consents.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consents.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consent-events.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consent-events.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consent-events.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consent-events.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consent-events.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'consent-events.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-cards.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-cards.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-cards.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-cards.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-cards.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-cards.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'trial-eligibility.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'trial-eligibility.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'trial-eligibility.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'trial-eligibility.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'trial-eligibility.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'trial-eligibility.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-plans.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-plans.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-plans.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-plans.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-plans.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-plans.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscriptions.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscriptions.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscriptions.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscriptions.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscriptions.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscriptions.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-payments.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-payments.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-payments.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-payments.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-payments.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-payments.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'provider-events.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'provider-events.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'provider-events.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'provider-events.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'provider-events.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'provider-events.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-events.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-events.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-events.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-events.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-events.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'subscription-events.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'notifications.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'notifications.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'notifications.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'notifications.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'notifications.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'notifications.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'analytics-events.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'analytics-events.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'analytics-events.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'analytics-events.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'analytics-events.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'analytics-events.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'max-pro-events.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'max-pro-events.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'max-pro-events.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'max-pro-events.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'max-pro-events.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'max-pro-events.manage' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-goals.*' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-goals.create' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-goals.read' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-goals.update' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-goals.delete' BEFORE 'roles.*';
  ALTER TYPE "public"."enum_roles_permissions" ADD VALUE 'user-goals.manage' BEFORE 'roles.*';
  CREATE TABLE "feature_flags" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"key" varchar NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "feature_flags_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "consents" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"purpose" "enum_consents_purpose" NOT NULL,
  	"status" "enum_consents_status" DEFAULT 'revoked' NOT NULL,
  	"version" varchar NOT NULL,
  	"granted_at" timestamp(3) with time zone,
  	"revoked_at" timestamp(3) with time zone,
  	"last_notified_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "consents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "consent_events" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"purpose" varchar NOT NULL,
  	"action" "enum_consent_events_action" NOT NULL,
  	"version" varchar NOT NULL,
  	"source" varchar,
  	"ip_address" varchar,
  	"user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "consent_events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "user_cards" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"card_id" uuid NOT NULL,
  	"display_name" varchar,
  	"status" "enum_user_cards_status" DEFAULT 'active' NOT NULL,
  	"credit_limit" numeric,
  	"billing_cycle_day" numeric,
  	"statement_day" numeric,
  	"opened_at" timestamp(3) with time zone,
  	"closed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "user_cards_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "trial_eligibility" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"trial_used" boolean DEFAULT false NOT NULL,
  	"trial_used_at" timestamp(3) with time zone,
  	"related_subscription_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "trial_eligibility_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "subscription_plans" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"provider_plan_id" varchar NOT NULL,
  	"price" numeric NOT NULL,
  	"currency" varchar DEFAULT 'INR' NOT NULL,
  	"billing_interval" "enum_subscription_plans_billing_interval" NOT NULL,
  	"trial_days" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscription_plans_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "subscriptions" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"plan_id" uuid NOT NULL,
  	"provider_subscription_id" varchar NOT NULL,
  	"status" "enum_subscriptions_status" NOT NULL,
  	"current_period_start" timestamp(3) with time zone,
  	"current_period_end" timestamp(3) with time zone,
  	"cancel_at_period_end" boolean DEFAULT false,
  	"canceled_at" timestamp(3) with time zone,
  	"ended_at" timestamp(3) with time zone,
  	"grace_period_started_at" timestamp(3) with time zone,
  	"grace_period_ends_at" timestamp(3) with time zone,
  	"provider_customer_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscriptions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "subscription_payments" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"subscription_id" uuid NOT NULL,
  	"provider_payment_id" varchar NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency" varchar DEFAULT 'INR' NOT NULL,
  	"status" "enum_subscription_payments_status" NOT NULL,
  	"raw_event" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscription_payments_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "provider_events" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"provider" varchar NOT NULL,
  	"provider_event_id" varchar NOT NULL,
  	"event_type" varchar NOT NULL,
  	"status" "enum_provider_events_status" DEFAULT 'pending' NOT NULL,
  	"raw_payload" jsonb NOT NULL,
  	"error_details" varchar,
  	"processed_at" timestamp(3) with time zone,
  	"unique_constraint" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "provider_events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "subscription_events" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"subscription_id" uuid NOT NULL,
  	"event_type" "enum_subscription_events_event_type" NOT NULL,
  	"notes" varchar,
  	"provider_event_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subscription_events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "notifications" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"type" "enum_notifications_type" NOT NULL,
  	"title" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"action_url" varchar,
  	"status" "enum_notifications_status" DEFAULT 'pending' NOT NULL,
  	"read_at" timestamp(3) with time zone,
  	"metadata" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "notifications_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "analytics_events" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid,
  	"anonymous_id" varchar,
  	"event" varchar NOT NULL,
  	"category" varchar,
  	"properties" jsonb,
  	"url" varchar,
  	"user_agent" varchar,
  	"ip_address" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "analytics_events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "max_pro_events" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"event_type" "enum_max_pro_events_event_type" NOT NULL,
  	"status" "enum_max_pro_events_status" DEFAULT 'generated' NOT NULL,
  	"priority" "enum_max_pro_events_priority" DEFAULT 'low' NOT NULL,
  	"engine_job_id" varchar,
  	"payload" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "max_pro_events_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "user_goals" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"type" "enum_user_goals_type" NOT NULL,
  	"status" "enum_user_goals_status" DEFAULT 'active' NOT NULL,
  	"related_card_id" uuid,
  	"target_amount" numeric NOT NULL,
  	"current_amount" numeric DEFAULT 0 NOT NULL,
  	"deadline" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "user_goals_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "feature_flags_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "consents_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "consent_events_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "user_cards_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "trial_eligibility_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subscription_plans_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subscriptions_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subscription_payments_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "provider_events_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subscription_events_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "notifications_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "analytics_events_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "max_pro_events_id" uuid;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "user_goals_id" uuid;
  ALTER TABLE "feature_flags_rels" ADD CONSTRAINT "feature_flags_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "feature_flags_rels" ADD CONSTRAINT "feature_flags_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "consents_rels" ADD CONSTRAINT "consents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."consents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "consents_rels" ADD CONSTRAINT "consents_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "consent_events" ADD CONSTRAINT "consent_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "consent_events_rels" ADD CONSTRAINT "consent_events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."consent_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "consent_events_rels" ADD CONSTRAINT "consent_events_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_card_id_credit_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."credit_card"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "user_cards_rels" ADD CONSTRAINT "user_cards_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_cards_rels" ADD CONSTRAINT "user_cards_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trial_eligibility" ADD CONSTRAINT "trial_eligibility_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trial_eligibility" ADD CONSTRAINT "trial_eligibility_related_subscription_id_subscriptions_id_fk" FOREIGN KEY ("related_subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "trial_eligibility_rels" ADD CONSTRAINT "trial_eligibility_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."trial_eligibility"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trial_eligibility_rels" ADD CONSTRAINT "trial_eligibility_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_plans_rels" ADD CONSTRAINT "subscription_plans_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_plans_rels" ADD CONSTRAINT "subscription_plans_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscriptions_rels" ADD CONSTRAINT "subscriptions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscriptions_rels" ADD CONSTRAINT "subscriptions_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_payments" ADD CONSTRAINT "subscription_payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscription_payments_rels" ADD CONSTRAINT "subscription_payments_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscription_payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_payments_rels" ADD CONSTRAINT "subscription_payments_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "provider_events_rels" ADD CONSTRAINT "provider_events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."provider_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "provider_events_rels" ADD CONSTRAINT "provider_events_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subscription_events_rels" ADD CONSTRAINT "subscription_events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."subscription_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subscription_events_rels" ADD CONSTRAINT "subscription_events_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notifications_rels" ADD CONSTRAINT "notifications_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "analytics_events_rels" ADD CONSTRAINT "analytics_events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."analytics_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "analytics_events_rels" ADD CONSTRAINT "analytics_events_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "max_pro_events" ADD CONSTRAINT "max_pro_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "max_pro_events_rels" ADD CONSTRAINT "max_pro_events_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."max_pro_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "max_pro_events_rels" ADD CONSTRAINT "max_pro_events_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "user_goals" ADD CONSTRAINT "user_goals_related_card_id_user_cards_id_fk" FOREIGN KEY ("related_card_id") REFERENCES "public"."user_cards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "user_goals_rels" ADD CONSTRAINT "user_goals_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."user_goals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "user_goals_rels" ADD CONSTRAINT "user_goals_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "feature_flags_key_idx" ON "feature_flags" USING btree ("key");
  CREATE INDEX "feature_flags_updated_at_idx" ON "feature_flags" USING btree ("updated_at");
  CREATE INDEX "feature_flags_created_at_idx" ON "feature_flags" USING btree ("created_at");
  CREATE INDEX "feature_flags_rels_order_idx" ON "feature_flags_rels" USING btree ("order");
  CREATE INDEX "feature_flags_rels_parent_idx" ON "feature_flags_rels" USING btree ("parent_id");
  CREATE INDEX "feature_flags_rels_path_idx" ON "feature_flags_rels" USING btree ("path");
  CREATE INDEX "feature_flags_rels_admin_id_idx" ON "feature_flags_rels" USING btree ("admin_id");
  CREATE INDEX "consents_user_idx" ON "consents" USING btree ("user_id");
  CREATE INDEX "consents_updated_at_idx" ON "consents" USING btree ("updated_at");
  CREATE INDEX "consents_created_at_idx" ON "consents" USING btree ("created_at");
  CREATE INDEX "consents_rels_order_idx" ON "consents_rels" USING btree ("order");
  CREATE INDEX "consents_rels_parent_idx" ON "consents_rels" USING btree ("parent_id");
  CREATE INDEX "consents_rels_path_idx" ON "consents_rels" USING btree ("path");
  CREATE INDEX "consents_rels_admin_id_idx" ON "consents_rels" USING btree ("admin_id");
  CREATE INDEX "consent_events_user_idx" ON "consent_events" USING btree ("user_id");
  CREATE INDEX "consent_events_purpose_idx" ON "consent_events" USING btree ("purpose");
  CREATE INDEX "consent_events_updated_at_idx" ON "consent_events" USING btree ("updated_at");
  CREATE INDEX "consent_events_created_at_idx" ON "consent_events" USING btree ("created_at");
  CREATE INDEX "consent_events_rels_order_idx" ON "consent_events_rels" USING btree ("order");
  CREATE INDEX "consent_events_rels_parent_idx" ON "consent_events_rels" USING btree ("parent_id");
  CREATE INDEX "consent_events_rels_path_idx" ON "consent_events_rels" USING btree ("path");
  CREATE INDEX "consent_events_rels_admin_id_idx" ON "consent_events_rels" USING btree ("admin_id");
  CREATE INDEX "user_cards_user_idx" ON "user_cards" USING btree ("user_id");
  CREATE INDEX "user_cards_card_idx" ON "user_cards" USING btree ("card_id");
  CREATE INDEX "user_cards_status_idx" ON "user_cards" USING btree ("status");
  CREATE INDEX "user_cards_updated_at_idx" ON "user_cards" USING btree ("updated_at");
  CREATE INDEX "user_cards_created_at_idx" ON "user_cards" USING btree ("created_at");
  CREATE INDEX "user_cards_rels_order_idx" ON "user_cards_rels" USING btree ("order");
  CREATE INDEX "user_cards_rels_parent_idx" ON "user_cards_rels" USING btree ("parent_id");
  CREATE INDEX "user_cards_rels_path_idx" ON "user_cards_rels" USING btree ("path");
  CREATE INDEX "user_cards_rels_admin_id_idx" ON "user_cards_rels" USING btree ("admin_id");
  CREATE UNIQUE INDEX "trial_eligibility_user_idx" ON "trial_eligibility" USING btree ("user_id");
  CREATE INDEX "trial_eligibility_trial_used_idx" ON "trial_eligibility" USING btree ("trial_used");
  CREATE INDEX "trial_eligibility_related_subscription_idx" ON "trial_eligibility" USING btree ("related_subscription_id");
  CREATE INDEX "trial_eligibility_updated_at_idx" ON "trial_eligibility" USING btree ("updated_at");
  CREATE INDEX "trial_eligibility_created_at_idx" ON "trial_eligibility" USING btree ("created_at");
  CREATE INDEX "trial_eligibility_rels_order_idx" ON "trial_eligibility_rels" USING btree ("order");
  CREATE INDEX "trial_eligibility_rels_parent_idx" ON "trial_eligibility_rels" USING btree ("parent_id");
  CREATE INDEX "trial_eligibility_rels_path_idx" ON "trial_eligibility_rels" USING btree ("path");
  CREATE INDEX "trial_eligibility_rels_admin_id_idx" ON "trial_eligibility_rels" USING btree ("admin_id");
  CREATE UNIQUE INDEX "subscription_plans_provider_plan_id_idx" ON "subscription_plans" USING btree ("provider_plan_id");
  CREATE INDEX "subscription_plans_updated_at_idx" ON "subscription_plans" USING btree ("updated_at");
  CREATE INDEX "subscription_plans_created_at_idx" ON "subscription_plans" USING btree ("created_at");
  CREATE INDEX "subscription_plans_rels_order_idx" ON "subscription_plans_rels" USING btree ("order");
  CREATE INDEX "subscription_plans_rels_parent_idx" ON "subscription_plans_rels" USING btree ("parent_id");
  CREATE INDEX "subscription_plans_rels_path_idx" ON "subscription_plans_rels" USING btree ("path");
  CREATE INDEX "subscription_plans_rels_admin_id_idx" ON "subscription_plans_rels" USING btree ("admin_id");
  CREATE INDEX "subscriptions_user_idx" ON "subscriptions" USING btree ("user_id");
  CREATE INDEX "subscriptions_plan_idx" ON "subscriptions" USING btree ("plan_id");
  CREATE UNIQUE INDEX "subscriptions_provider_subscription_id_idx" ON "subscriptions" USING btree ("provider_subscription_id");
  CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");
  CREATE INDEX "subscriptions_updated_at_idx" ON "subscriptions" USING btree ("updated_at");
  CREATE INDEX "subscriptions_created_at_idx" ON "subscriptions" USING btree ("created_at");
  CREATE INDEX "subscriptions_rels_order_idx" ON "subscriptions_rels" USING btree ("order");
  CREATE INDEX "subscriptions_rels_parent_idx" ON "subscriptions_rels" USING btree ("parent_id");
  CREATE INDEX "subscriptions_rels_path_idx" ON "subscriptions_rels" USING btree ("path");
  CREATE INDEX "subscriptions_rels_admin_id_idx" ON "subscriptions_rels" USING btree ("admin_id");
  CREATE INDEX "subscription_payments_subscription_idx" ON "subscription_payments" USING btree ("subscription_id");
  CREATE UNIQUE INDEX "subscription_payments_provider_payment_id_idx" ON "subscription_payments" USING btree ("provider_payment_id");
  CREATE INDEX "subscription_payments_status_idx" ON "subscription_payments" USING btree ("status");
  CREATE INDEX "subscription_payments_updated_at_idx" ON "subscription_payments" USING btree ("updated_at");
  CREATE INDEX "subscription_payments_created_at_idx" ON "subscription_payments" USING btree ("created_at");
  CREATE INDEX "subscription_payments_rels_order_idx" ON "subscription_payments_rels" USING btree ("order");
  CREATE INDEX "subscription_payments_rels_parent_idx" ON "subscription_payments_rels" USING btree ("parent_id");
  CREATE INDEX "subscription_payments_rels_path_idx" ON "subscription_payments_rels" USING btree ("path");
  CREATE INDEX "subscription_payments_rels_admin_id_idx" ON "subscription_payments_rels" USING btree ("admin_id");
  CREATE INDEX "provider_events_provider_idx" ON "provider_events" USING btree ("provider");
  CREATE INDEX "provider_events_event_type_idx" ON "provider_events" USING btree ("event_type");
  CREATE INDEX "provider_events_status_idx" ON "provider_events" USING btree ("status");
  CREATE UNIQUE INDEX "provider_events_unique_constraint_idx" ON "provider_events" USING btree ("unique_constraint");
  CREATE INDEX "provider_events_updated_at_idx" ON "provider_events" USING btree ("updated_at");
  CREATE INDEX "provider_events_created_at_idx" ON "provider_events" USING btree ("created_at");
  CREATE INDEX "provider_events_rels_order_idx" ON "provider_events_rels" USING btree ("order");
  CREATE INDEX "provider_events_rels_parent_idx" ON "provider_events_rels" USING btree ("parent_id");
  CREATE INDEX "provider_events_rels_path_idx" ON "provider_events_rels" USING btree ("path");
  CREATE INDEX "provider_events_rels_admin_id_idx" ON "provider_events_rels" USING btree ("admin_id");
  CREATE INDEX "subscription_events_subscription_idx" ON "subscription_events" USING btree ("subscription_id");
  CREATE INDEX "subscription_events_event_type_idx" ON "subscription_events" USING btree ("event_type");
  CREATE INDEX "subscription_events_updated_at_idx" ON "subscription_events" USING btree ("updated_at");
  CREATE INDEX "subscription_events_created_at_idx" ON "subscription_events" USING btree ("created_at");
  CREATE INDEX "subscription_events_rels_order_idx" ON "subscription_events_rels" USING btree ("order");
  CREATE INDEX "subscription_events_rels_parent_idx" ON "subscription_events_rels" USING btree ("parent_id");
  CREATE INDEX "subscription_events_rels_path_idx" ON "subscription_events_rels" USING btree ("path");
  CREATE INDEX "subscription_events_rels_admin_id_idx" ON "subscription_events_rels" USING btree ("admin_id");
  CREATE INDEX "notifications_user_idx" ON "notifications" USING btree ("user_id");
  CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");
  CREATE INDEX "notifications_updated_at_idx" ON "notifications" USING btree ("updated_at");
  CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");
  CREATE INDEX "notifications_rels_order_idx" ON "notifications_rels" USING btree ("order");
  CREATE INDEX "notifications_rels_parent_idx" ON "notifications_rels" USING btree ("parent_id");
  CREATE INDEX "notifications_rels_path_idx" ON "notifications_rels" USING btree ("path");
  CREATE INDEX "notifications_rels_admin_id_idx" ON "notifications_rels" USING btree ("admin_id");
  CREATE INDEX "analytics_events_user_idx" ON "analytics_events" USING btree ("user_id");
  CREATE INDEX "analytics_events_anonymous_id_idx" ON "analytics_events" USING btree ("anonymous_id");
  CREATE INDEX "analytics_events_event_idx" ON "analytics_events" USING btree ("event");
  CREATE INDEX "analytics_events_category_idx" ON "analytics_events" USING btree ("category");
  CREATE INDEX "analytics_events_updated_at_idx" ON "analytics_events" USING btree ("updated_at");
  CREATE INDEX "analytics_events_created_at_idx" ON "analytics_events" USING btree ("created_at");
  CREATE INDEX "analytics_events_rels_order_idx" ON "analytics_events_rels" USING btree ("order");
  CREATE INDEX "analytics_events_rels_parent_idx" ON "analytics_events_rels" USING btree ("parent_id");
  CREATE INDEX "analytics_events_rels_path_idx" ON "analytics_events_rels" USING btree ("path");
  CREATE INDEX "analytics_events_rels_admin_id_idx" ON "analytics_events_rels" USING btree ("admin_id");
  CREATE INDEX "max_pro_events_user_idx" ON "max_pro_events" USING btree ("user_id");
  CREATE INDEX "max_pro_events_event_type_idx" ON "max_pro_events" USING btree ("event_type");
  CREATE INDEX "max_pro_events_updated_at_idx" ON "max_pro_events" USING btree ("updated_at");
  CREATE INDEX "max_pro_events_created_at_idx" ON "max_pro_events" USING btree ("created_at");
  CREATE INDEX "max_pro_events_rels_order_idx" ON "max_pro_events_rels" USING btree ("order");
  CREATE INDEX "max_pro_events_rels_parent_idx" ON "max_pro_events_rels" USING btree ("parent_id");
  CREATE INDEX "max_pro_events_rels_path_idx" ON "max_pro_events_rels" USING btree ("path");
  CREATE INDEX "max_pro_events_rels_admin_id_idx" ON "max_pro_events_rels" USING btree ("admin_id");
  CREATE INDEX "user_goals_user_idx" ON "user_goals" USING btree ("user_id");
  CREATE INDEX "user_goals_type_idx" ON "user_goals" USING btree ("type");
  CREATE INDEX "user_goals_status_idx" ON "user_goals" USING btree ("status");
  CREATE INDEX "user_goals_related_card_idx" ON "user_goals" USING btree ("related_card_id");
  CREATE INDEX "user_goals_updated_at_idx" ON "user_goals" USING btree ("updated_at");
  CREATE INDEX "user_goals_created_at_idx" ON "user_goals" USING btree ("created_at");
  CREATE INDEX "user_goals_rels_order_idx" ON "user_goals_rels" USING btree ("order");
  CREATE INDEX "user_goals_rels_parent_idx" ON "user_goals_rels" USING btree ("parent_id");
  CREATE INDEX "user_goals_rels_path_idx" ON "user_goals_rels" USING btree ("path");
  CREATE INDEX "user_goals_rels_admin_id_idx" ON "user_goals_rels" USING btree ("admin_id");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_feature_flags_fk" FOREIGN KEY ("feature_flags_id") REFERENCES "public"."feature_flags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consents_fk" FOREIGN KEY ("consents_id") REFERENCES "public"."consents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_consent_events_fk" FOREIGN KEY ("consent_events_id") REFERENCES "public"."consent_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_cards_fk" FOREIGN KEY ("user_cards_id") REFERENCES "public"."user_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_trial_eligibility_fk" FOREIGN KEY ("trial_eligibility_id") REFERENCES "public"."trial_eligibility"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscription_plans_fk" FOREIGN KEY ("subscription_plans_id") REFERENCES "public"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscriptions_fk" FOREIGN KEY ("subscriptions_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscription_payments_fk" FOREIGN KEY ("subscription_payments_id") REFERENCES "public"."subscription_payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_provider_events_fk" FOREIGN KEY ("provider_events_id") REFERENCES "public"."provider_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subscription_events_fk" FOREIGN KEY ("subscription_events_id") REFERENCES "public"."subscription_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notifications_fk" FOREIGN KEY ("notifications_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_analytics_events_fk" FOREIGN KEY ("analytics_events_id") REFERENCES "public"."analytics_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_max_pro_events_fk" FOREIGN KEY ("max_pro_events_id") REFERENCES "public"."max_pro_events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_user_goals_fk" FOREIGN KEY ("user_goals_id") REFERENCES "public"."user_goals"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_feature_flags_id_idx" ON "payload_locked_documents_rels" USING btree ("feature_flags_id");
  CREATE INDEX "payload_locked_documents_rels_consents_id_idx" ON "payload_locked_documents_rels" USING btree ("consents_id");
  CREATE INDEX "payload_locked_documents_rels_consent_events_id_idx" ON "payload_locked_documents_rels" USING btree ("consent_events_id");
  CREATE INDEX "payload_locked_documents_rels_user_cards_id_idx" ON "payload_locked_documents_rels" USING btree ("user_cards_id");
  CREATE INDEX "payload_locked_documents_rels_trial_eligibility_id_idx" ON "payload_locked_documents_rels" USING btree ("trial_eligibility_id");
  CREATE INDEX "payload_locked_documents_rels_subscription_plans_id_idx" ON "payload_locked_documents_rels" USING btree ("subscription_plans_id");
  CREATE INDEX "payload_locked_documents_rels_subscriptions_id_idx" ON "payload_locked_documents_rels" USING btree ("subscriptions_id");
  CREATE INDEX "payload_locked_documents_rels_subscription_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("subscription_payments_id");
  CREATE INDEX "payload_locked_documents_rels_provider_events_id_idx" ON "payload_locked_documents_rels" USING btree ("provider_events_id");
  CREATE INDEX "payload_locked_documents_rels_subscription_events_id_idx" ON "payload_locked_documents_rels" USING btree ("subscription_events_id");
  CREATE INDEX "payload_locked_documents_rels_notifications_id_idx" ON "payload_locked_documents_rels" USING btree ("notifications_id");
  CREATE INDEX "payload_locked_documents_rels_analytics_events_id_idx" ON "payload_locked_documents_rels" USING btree ("analytics_events_id");
  CREATE INDEX "payload_locked_documents_rels_max_pro_events_id_idx" ON "payload_locked_documents_rels" USING btree ("max_pro_events_id");
  CREATE INDEX "payload_locked_documents_rels_user_goals_id_idx" ON "payload_locked_documents_rels" USING btree ("user_goals_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "feature_flags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "feature_flags_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "consents" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "consents_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "consent_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "consent_events_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "user_cards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "user_cards_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trial_eligibility" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "trial_eligibility_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_plans" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_plans_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscriptions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscriptions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_payments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_payments_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "provider_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "provider_events_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subscription_events_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "notifications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "notifications_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "analytics_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "analytics_events_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "max_pro_events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "max_pro_events_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "user_goals" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "user_goals_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "feature_flags" CASCADE;
  DROP TABLE "feature_flags_rels" CASCADE;
  DROP TABLE "consents" CASCADE;
  DROP TABLE "consents_rels" CASCADE;
  DROP TABLE "consent_events" CASCADE;
  DROP TABLE "consent_events_rels" CASCADE;
  DROP TABLE "user_cards" CASCADE;
  DROP TABLE "user_cards_rels" CASCADE;
  DROP TABLE "trial_eligibility" CASCADE;
  DROP TABLE "trial_eligibility_rels" CASCADE;
  DROP TABLE "subscription_plans" CASCADE;
  DROP TABLE "subscription_plans_rels" CASCADE;
  DROP TABLE "subscriptions" CASCADE;
  DROP TABLE "subscriptions_rels" CASCADE;
  DROP TABLE "subscription_payments" CASCADE;
  DROP TABLE "subscription_payments_rels" CASCADE;
  DROP TABLE "provider_events" CASCADE;
  DROP TABLE "provider_events_rels" CASCADE;
  DROP TABLE "subscription_events" CASCADE;
  DROP TABLE "subscription_events_rels" CASCADE;
  DROP TABLE "notifications" CASCADE;
  DROP TABLE "notifications_rels" CASCADE;
  DROP TABLE "analytics_events" CASCADE;
  DROP TABLE "analytics_events_rels" CASCADE;
  DROP TABLE "max_pro_events" CASCADE;
  DROP TABLE "max_pro_events_rels" CASCADE;
  DROP TABLE "user_goals" CASCADE;
  DROP TABLE "user_goals_rels" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_feature_flags_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_consents_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_consent_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_user_cards_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_trial_eligibility_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subscription_plans_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subscriptions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subscription_payments_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_provider_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subscription_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_notifications_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_analytics_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_max_pro_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_user_goals_fk";
  
  ALTER TABLE "roles_permissions" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_roles_permissions";
  CREATE TYPE "public"."enum_roles_permissions" AS ENUM('*', '*.read', '*.create', '*.update', '*.delete', 'users.*', 'users.create', 'users.read', 'users.update', 'users.delete', 'users.manage', 'media.*', 'media.create', 'media.read', 'media.update', 'media.delete', 'media.manage', 'admin.*', 'admin.create', 'admin.read', 'admin.update', 'admin.delete', 'admin.manage', 'otp.*', 'otp.create', 'otp.read', 'otp.update', 'otp.delete', 'otp.manage', 'gmail-connections.*', 'gmail-connections.create', 'gmail-connections.read', 'gmail-connections.update', 'gmail-connections.delete', 'gmail-connections.manage', 'statements.*', 'statements.create', 'statements.read', 'statements.update', 'statements.delete', 'statements.manage', 'banks.*', 'banks.create', 'banks.read', 'banks.update', 'banks.delete', 'banks.manage', 'banks.publish', 'CreditCard.*', 'CreditCard.create', 'CreditCard.read', 'CreditCard.update', 'CreditCard.delete', 'CreditCard.manage', 'CreditCard.publish', 'roles.*', 'roles.create', 'roles.read', 'roles.update', 'roles.delete', 'roles.manage');
  ALTER TABLE "roles_permissions" ALTER COLUMN "value" SET DATA TYPE "public"."enum_roles_permissions" USING "value"::"public"."enum_roles_permissions";
  DROP INDEX "payload_locked_documents_rels_feature_flags_id_idx";
  DROP INDEX "payload_locked_documents_rels_consents_id_idx";
  DROP INDEX "payload_locked_documents_rels_consent_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_user_cards_id_idx";
  DROP INDEX "payload_locked_documents_rels_trial_eligibility_id_idx";
  DROP INDEX "payload_locked_documents_rels_subscription_plans_id_idx";
  DROP INDEX "payload_locked_documents_rels_subscriptions_id_idx";
  DROP INDEX "payload_locked_documents_rels_subscription_payments_id_idx";
  DROP INDEX "payload_locked_documents_rels_provider_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_subscription_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_notifications_id_idx";
  DROP INDEX "payload_locked_documents_rels_analytics_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_max_pro_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_user_goals_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "feature_flags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "consents_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "consent_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "user_cards_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "trial_eligibility_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subscription_plans_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subscriptions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subscription_payments_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "provider_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subscription_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "notifications_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "analytics_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "max_pro_events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "user_goals_id";
  DROP TYPE "public"."enum_consents_purpose";
  DROP TYPE "public"."enum_consents_status";
  DROP TYPE "public"."enum_consent_events_action";
  DROP TYPE "public"."enum_user_cards_status";
  DROP TYPE "public"."enum_subscription_plans_billing_interval";
  DROP TYPE "public"."enum_subscriptions_status";
  DROP TYPE "public"."enum_subscription_payments_status";
  DROP TYPE "public"."enum_provider_events_status";
  DROP TYPE "public"."enum_subscription_events_event_type";
  DROP TYPE "public"."enum_notifications_type";
  DROP TYPE "public"."enum_notifications_status";
  DROP TYPE "public"."enum_max_pro_events_event_type";
  DROP TYPE "public"."enum_max_pro_events_status";
  DROP TYPE "public"."enum_max_pro_events_priority";
  DROP TYPE "public"."enum_user_goals_type";
  DROP TYPE "public"."enum_user_goals_status";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
