import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_authentication_provider" AS ENUM('email', 'phone', 'google');
  CREATE TYPE "public"."enum_users_employment_type" AS ENUM('full_time', 'part_time', 'self_employed', 'unemployed', 'student', 'retired', 'other');
  CREATE TYPE "public"."enum_users_account_status" AS ENUM('active', 'pending', 'suspended');
  CREATE TYPE "public"."enum_otp_channel" AS ENUM('email', 'phone');
  CREATE TYPE "public"."enum_gmail_connections_status" AS ENUM('active', 'revoked', 'expired');
  CREATE TYPE "public"."enum_statements_source" AS ENUM('gmail', 'upload');
  CREATE TYPE "public"."enum_statements_status" AS ENUM('pending', 'processing', 'parsed', 'error');
  CREATE TYPE "public"."enum_banks_statement_config_parser_type" AS ENUM('dedicated', 'generic', 'ocr_llm');
  CREATE TYPE "public"."enum_banks_data_source" AS ENUM('bank_website', 'mitc', 'statement', 'research');
  CREATE TYPE "public"."enum_banks_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__banks_v_version_statement_config_parser_type" AS ENUM('dedicated', 'generic', 'ocr_llm');
  CREATE TYPE "public"."enum__banks_v_version_data_source" AS ENUM('bank_website', 'mitc', 'statement', 'research');
  CREATE TYPE "public"."enum__banks_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_credit_card_eligibility_employment_types" AS ENUM('salaried', 'self_employed', 'business');
  CREATE TYPE "public"."enum_credit_card_card_type" AS ENUM('credit_card', 'secured_credit_card', 'rupay', 'co_brand');
  CREATE TYPE "public"."enum_credit_card_network" AS ENUM('visa', 'mastercard', 'amex', 'rupay');
  CREATE TYPE "public"."enum_credit_card_state" AS ENUM('active', 'invite_only', 'discontinued', 'pending_research');
  CREATE TYPE "public"."enum_credit_card_base_reward_type" AS ENUM('points', 'cashback');
  CREATE TYPE "public"."enum_credit_card_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__credit_card_v_version_eligibility_employment_types" AS ENUM('salaried', 'self_employed', 'business');
  CREATE TYPE "public"."enum__credit_card_v_version_card_type" AS ENUM('credit_card', 'secured_credit_card', 'rupay', 'co_brand');
  CREATE TYPE "public"."enum__credit_card_v_version_network" AS ENUM('visa', 'mastercard', 'amex', 'rupay');
  CREATE TYPE "public"."enum__credit_card_v_version_state" AS ENUM('active', 'invite_only', 'discontinued', 'pending_research');
  CREATE TYPE "public"."enum__credit_card_v_version_base_reward_type" AS ENUM('points', 'cashback');
  CREATE TYPE "public"."enum__credit_card_v_version_status" AS ENUM('draft', 'published');
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
  CREATE TYPE "public"."enum_cards_brand" AS ENUM('visa', 'mastercard', 'amex', 'rupay', 'unknown');
  CREATE TYPE "public"."enum_card_audit_logs_action" AS ENUM('card_create', 'card_update', 'card_delete', 'pan_reveal', 'card_lookup', 'card_key_rotation');
  CREATE TYPE "public"."enum_card_audit_logs_actor_type" AS ENUM('admin', 'users');
  CREATE TYPE "public"."enum_roles_permissions" AS ENUM('*', '*.read', '*.create', '*.update', '*.delete', 'users.*', 'users.create', 'users.read', 'users.update', 'users.delete', 'users.manage', 'media.*', 'media.create', 'media.read', 'media.update', 'media.delete', 'media.manage', 'admin.*', 'admin.create', 'admin.read', 'admin.update', 'admin.delete', 'admin.manage', 'otp.*', 'otp.create', 'otp.read', 'otp.update', 'otp.delete', 'otp.manage', 'gmail-connections.*', 'gmail-connections.create', 'gmail-connections.read', 'gmail-connections.update', 'gmail-connections.delete', 'gmail-connections.manage', 'statements.*', 'statements.create', 'statements.read', 'statements.update', 'statements.delete', 'statements.manage', 'banks.*', 'banks.create', 'banks.read', 'banks.update', 'banks.delete', 'banks.manage', 'banks.publish', 'CreditCard.*', 'CreditCard.create', 'CreditCard.read', 'CreditCard.update', 'CreditCard.delete', 'CreditCard.manage', 'CreditCard.publish', 'feature-flags.*', 'feature-flags.create', 'feature-flags.read', 'feature-flags.update', 'feature-flags.delete', 'feature-flags.manage', 'consents.*', 'consents.create', 'consents.read', 'consents.update', 'consents.delete', 'consents.manage', 'consent-events.*', 'consent-events.create', 'consent-events.read', 'consent-events.update', 'consent-events.delete', 'consent-events.manage', 'user-cards.*', 'user-cards.create', 'user-cards.read', 'user-cards.update', 'user-cards.delete', 'user-cards.manage', 'trial-eligibility.*', 'trial-eligibility.create', 'trial-eligibility.read', 'trial-eligibility.update', 'trial-eligibility.delete', 'trial-eligibility.manage', 'subscription-plans.*', 'subscription-plans.create', 'subscription-plans.read', 'subscription-plans.update', 'subscription-plans.delete', 'subscription-plans.manage', 'subscriptions.*', 'subscriptions.create', 'subscriptions.read', 'subscriptions.update', 'subscriptions.delete', 'subscriptions.manage', 'subscription-payments.*', 'subscription-payments.create', 'subscription-payments.read', 'subscription-payments.update', 'subscription-payments.delete', 'subscription-payments.manage', 'provider-events.*', 'provider-events.create', 'provider-events.read', 'provider-events.update', 'provider-events.delete', 'provider-events.manage', 'subscription-events.*', 'subscription-events.create', 'subscription-events.read', 'subscription-events.update', 'subscription-events.delete', 'subscription-events.manage', 'notifications.*', 'notifications.create', 'notifications.read', 'notifications.update', 'notifications.delete', 'notifications.manage', 'analytics-events.*', 'analytics-events.create', 'analytics-events.read', 'analytics-events.update', 'analytics-events.delete', 'analytics-events.manage', 'max-pro-events.*', 'max-pro-events.create', 'max-pro-events.read', 'max-pro-events.update', 'max-pro-events.delete', 'max-pro-events.manage', 'user-goals.*', 'user-goals.create', 'user-goals.read', 'user-goals.update', 'user-goals.delete', 'user-goals.manage', 'cards.*', 'cards.create', 'cards.read', 'cards.update', 'cards.delete', 'cards.manage', 'card-audit-logs.*', 'card-audit-logs.create', 'card-audit-logs.read', 'card-audit-logs.update', 'card-audit-logs.delete', 'card-audit-logs.manage', 'roles.*', 'roles.create', 'roles.read', 'roles.update', 'roles.delete', 'roles.manage');
  CREATE TYPE "public"."enum_roles_visible_for" AS ENUM('users', 'admin');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'processProviderEvent', 'expireSubscriptions', 'reconcileSubscriptions', 'sendNotification', 'fanoutDevaluation');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'processProviderEvent', 'expireSubscriptions', 'reconcileSubscriptions', 'sendNotification', 'fanoutDevaluation');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"phone" varchar,
  	"authentication_provider" "enum_users_authentication_provider" DEFAULT 'email' NOT NULL,
  	"authentication_provider_id" varchar,
  	"profile_completed" boolean DEFAULT false NOT NULL,
  	"income" numeric,
  	"employment_type" "enum_users_employment_type",
  	"account_status" "enum_users_account_status" DEFAULT 'active' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "media" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "media_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "admin_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "admin" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"role_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "admin_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "otp" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"identifier" varchar NOT NULL,
  	"channel" "enum_otp_channel" NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"salt" varchar NOT NULL,
  	"expires_at" numeric NOT NULL,
  	"attempts" numeric DEFAULT 0,
  	"max_attempts" numeric DEFAULT 5,
  	"last_sent_at" numeric NOT NULL,
  	"resend_at" numeric NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "otp_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "gmail_connections" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"gmail_address" varchar NOT NULL,
  	"encrypted_refresh_token" varchar NOT NULL,
  	"token_iv" varchar NOT NULL,
  	"token_tag" varchar NOT NULL,
  	"scopes" varchar,
  	"status" "enum_gmail_connections_status" DEFAULT 'active' NOT NULL,
  	"connected_at" timestamp(3) with time zone NOT NULL,
  	"last_refreshed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "gmail_connections_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "statements" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"source" "enum_statements_source" DEFAULT 'gmail' NOT NULL,
  	"issuer" varchar NOT NULL,
  	"gmail_message_id" varchar,
  	"attachment_filename" varchar,
  	"status" "enum_statements_status" DEFAULT 'pending' NOT NULL,
  	"error_message" varchar,
  	"transaction_count" numeric,
  	"total_amount" numeric,
  	"account_last4" varchar,
  	"period_start" timestamp(3) with time zone,
  	"period_end" timestamp(3) with time zone,
  	"pdf_id" uuid,
  	"pdf_size" numeric,
  	"parsed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "statements_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "banks_statement_config_statement_email_senders" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email" varchar
  );
  
  CREATE TABLE "banks_statement_config_statement_subject_patterns" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"pattern" varchar
  );
  
  CREATE TABLE "banks" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"data_version" varchar,
  	"code" varchar,
  	"short_name" varchar,
  	"country" varchar DEFAULT 'India',
  	"website" varchar,
  	"logo_id" uuid,
  	"statement_config_parser_type" "enum_banks_statement_config_parser_type",
  	"statement_config_password_hint" varchar,
  	"data_source" "enum_banks_data_source",
  	"last_verified_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone,
  	"_status" "enum_banks_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "banks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "_banks_v_version_statement_config_statement_email_senders" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY NOT NULL,
  	"email" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_banks_v_version_statement_config_statement_subject_patterns" (
  	"_order" integer NOT NULL,
  	"_parent_id" uuid NOT NULL,
  	"id" uuid PRIMARY KEY NOT NULL,
  	"pattern" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_banks_v" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"parent_id" uuid,
  	"version_name" varchar,
  	"version_data_version" varchar,
  	"version_code" varchar,
  	"version_short_name" varchar,
  	"version_country" varchar DEFAULT 'India',
  	"version_website" varchar,
  	"version_logo_id" uuid,
  	"version_statement_config_parser_type" "enum__banks_v_version_statement_config_parser_type",
  	"version_statement_config_password_hint" varchar,
  	"version_data_source" "enum__banks_v_version_data_source",
  	"version_last_verified_at" timestamp(3) with time zone,
  	"version_notes" varchar,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_deleted_at" timestamp(3) with time zone,
  	"version__status" "enum__banks_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_banks_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "credit_card_eligibility_employment_types" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_credit_card_eligibility_employment_types",
  	"id" uuid PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "credit_card" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"data_version" varchar,
  	"slug" varchar,
  	"bank_id" uuid,
  	"card_type" "enum_credit_card_card_type",
  	"network" "enum_credit_card_network",
  	"state" "enum_credit_card_state" DEFAULT 'active',
  	"eligibility_minimum_income" numeric,
  	"eligibility_invite_only" boolean DEFAULT false,
  	"fees_joining_fee" numeric,
  	"fees_annual_fee" numeric,
  	"fees_renewal_fee" numeric,
  	"fees_fee_waiver_threshold" numeric,
  	"base_reward_type" "enum_credit_card_base_reward_type",
  	"base_reward_points_per_block" numeric,
  	"base_reward_block_size" numeric,
  	"base_reward_cashback_percentage" numeric,
  	"forex_markup" numeric,
  	"fuel_surcharge_waived" boolean,
  	"fuel_surcharge_waiver_percentage" numeric,
  	"fuel_surcharge_monthly_cap" numeric,
  	"point_valuation_realistic_value" numeric,
  	"point_valuation_ceiling_value" numeric,
  	"point_expiry" numeric,
  	"image_id" uuid,
  	"description" varchar,
  	"last_verified_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone,
  	"_status" "enum_credit_card_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "credit_card_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "_credit_card_v_version_eligibility_employment_types" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum__credit_card_v_version_eligibility_employment_types",
  	"id" uuid PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_credit_card_v" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"parent_id" uuid,
  	"version_name" varchar,
  	"version_data_version" varchar,
  	"version_slug" varchar,
  	"version_bank_id" uuid,
  	"version_card_type" "enum__credit_card_v_version_card_type",
  	"version_network" "enum__credit_card_v_version_network",
  	"version_state" "enum__credit_card_v_version_state" DEFAULT 'active',
  	"version_eligibility_minimum_income" numeric,
  	"version_eligibility_invite_only" boolean DEFAULT false,
  	"version_fees_joining_fee" numeric,
  	"version_fees_annual_fee" numeric,
  	"version_fees_renewal_fee" numeric,
  	"version_fees_fee_waiver_threshold" numeric,
  	"version_base_reward_type" "enum__credit_card_v_version_base_reward_type",
  	"version_base_reward_points_per_block" numeric,
  	"version_base_reward_block_size" numeric,
  	"version_base_reward_cashback_percentage" numeric,
  	"version_forex_markup" numeric,
  	"version_fuel_surcharge_waived" boolean,
  	"version_fuel_surcharge_waiver_percentage" numeric,
  	"version_fuel_surcharge_monthly_cap" numeric,
  	"version_point_valuation_realistic_value" numeric,
  	"version_point_valuation_ceiling_value" numeric,
  	"version_point_expiry" numeric,
  	"version_image_id" uuid,
  	"version_description" varchar,
  	"version_last_verified_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_deleted_at" timestamp(3) with time zone,
  	"version__status" "enum__credit_card_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_credit_card_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
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
  
  CREATE TABLE "cards" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"user_id" uuid NOT NULL,
  	"nickname" varchar,
  	"brand" "enum_cards_brand",
  	"pan_last4" varchar,
  	"pan_lookup" varchar,
  	"expiry_month" numeric NOT NULL,
  	"expiry_year" numeric NOT NULL,
  	"encrypted_card_data" varchar,
  	"card_data_iv" varchar,
  	"card_data_tag" varchar,
  	"card_data_key_version" varchar,
  	"card_data_algorithm" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cards_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "card_audit_logs" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"action" "enum_card_audit_logs_action" NOT NULL,
  	"card_id" varchar,
  	"card_masked" varchar,
  	"actor_type" "enum_card_audit_logs_actor_type" NOT NULL,
  	"actor_id" varchar NOT NULL,
  	"actor_email" varchar,
  	"ip" varchar,
  	"user_agent" varchar,
  	"details" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "card_audit_logs_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "roles_permissions" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_roles_permissions",
  	"id" uuid PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "roles_visible_for" (
  	"order" integer NOT NULL,
  	"parent_id" uuid NOT NULL,
  	"value" "enum_roles_visible_for",
  	"id" uuid PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "roles" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"description" varchar,
  	"active" boolean DEFAULT true,
  	"protected" boolean DEFAULT false,
  	"config_hash" varchar,
  	"config_version" numeric DEFAULT 0,
  	"system_managed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "roles_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"admin_id" uuid
  );
  
  CREATE TABLE "payload_kv" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
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
  
  CREATE TABLE "payload_locked_documents" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid,
  	"media_id" uuid,
  	"admin_id" uuid,
  	"otp_id" uuid,
  	"gmail_connections_id" uuid,
  	"statements_id" uuid,
  	"banks_id" uuid,
  	"credit_card_id" uuid,
  	"feature_flags_id" uuid,
  	"consents_id" uuid,
  	"consent_events_id" uuid,
  	"user_cards_id" uuid,
  	"trial_eligibility_id" uuid,
  	"subscription_plans_id" uuid,
  	"subscriptions_id" uuid,
  	"subscription_payments_id" uuid,
  	"provider_events_id" uuid,
  	"subscription_events_id" uuid,
  	"notifications_id" uuid,
  	"analytics_events_id" uuid,
  	"max_pro_events_id" uuid,
  	"user_goals_id" uuid,
  	"cards_id" uuid,
  	"card_audit_logs_id" uuid,
  	"roles_id" uuid
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" uuid NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" uuid,
  	"admin_id" uuid
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" uuid PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_rels" ADD CONSTRAINT "media_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "admin" ADD CONSTRAINT "admin_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "admin_rels" ADD CONSTRAINT "admin_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "admin_rels" ADD CONSTRAINT "admin_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "otp_rels" ADD CONSTRAINT "otp_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."otp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "otp_rels" ADD CONSTRAINT "otp_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gmail_connections" ADD CONSTRAINT "gmail_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "gmail_connections_rels" ADD CONSTRAINT "gmail_connections_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gmail_connections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gmail_connections_rels" ADD CONSTRAINT "gmail_connections_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "statements" ADD CONSTRAINT "statements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "statements" ADD CONSTRAINT "statements_pdf_id_media_id_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "statements_rels" ADD CONSTRAINT "statements_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."statements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "statements_rels" ADD CONSTRAINT "statements_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banks_statement_config_statement_email_senders" ADD CONSTRAINT "banks_statement_config_statement_email_senders_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."banks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banks_statement_config_statement_subject_patterns" ADD CONSTRAINT "banks_statement_config_statement_subject_patterns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."banks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banks" ADD CONSTRAINT "banks_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "banks_rels" ADD CONSTRAINT "banks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."banks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banks_rels" ADD CONSTRAINT "banks_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_banks_v_version_statement_config_statement_email_senders" ADD CONSTRAINT "_banks_v_version_statement_config_statement_email_senders_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_banks_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_banks_v_version_statement_config_statement_subject_patterns" ADD CONSTRAINT "_banks_v_version_statement_config_statement_subject_patterns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_banks_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_banks_v" ADD CONSTRAINT "_banks_v_parent_id_banks_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."banks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_banks_v" ADD CONSTRAINT "_banks_v_version_logo_id_media_id_fk" FOREIGN KEY ("version_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_banks_v_rels" ADD CONSTRAINT "_banks_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_banks_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_banks_v_rels" ADD CONSTRAINT "_banks_v_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "credit_card_eligibility_employment_types" ADD CONSTRAINT "credit_card_eligibility_employment_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."credit_card"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "credit_card" ADD CONSTRAINT "credit_card_bank_id_banks_id_fk" FOREIGN KEY ("bank_id") REFERENCES "public"."banks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "credit_card" ADD CONSTRAINT "credit_card_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "credit_card_rels" ADD CONSTRAINT "credit_card_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."credit_card"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "credit_card_rels" ADD CONSTRAINT "credit_card_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_credit_card_v_version_eligibility_employment_types" ADD CONSTRAINT "_credit_card_v_version_eligibility_employment_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_credit_card_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_credit_card_v" ADD CONSTRAINT "_credit_card_v_parent_id_credit_card_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."credit_card"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_credit_card_v" ADD CONSTRAINT "_credit_card_v_version_bank_id_banks_id_fk" FOREIGN KEY ("version_bank_id") REFERENCES "public"."banks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_credit_card_v" ADD CONSTRAINT "_credit_card_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_credit_card_v_rels" ADD CONSTRAINT "_credit_card_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_credit_card_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_credit_card_v_rels" ADD CONSTRAINT "_credit_card_v_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
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
  ALTER TABLE "cards" ADD CONSTRAINT "cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cards_rels" ADD CONSTRAINT "cards_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cards_rels" ADD CONSTRAINT "cards_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "card_audit_logs_rels" ADD CONSTRAINT "card_audit_logs_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."card_audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "card_audit_logs_rels" ADD CONSTRAINT "card_audit_logs_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_permissions" ADD CONSTRAINT "roles_permissions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_visible_for" ADD CONSTRAINT "roles_visible_for_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_rels" ADD CONSTRAINT "roles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_rels" ADD CONSTRAINT "roles_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_otp_fk" FOREIGN KEY ("otp_id") REFERENCES "public"."otp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gmail_connections_fk" FOREIGN KEY ("gmail_connections_id") REFERENCES "public"."gmail_connections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_statements_fk" FOREIGN KEY ("statements_id") REFERENCES "public"."statements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_banks_fk" FOREIGN KEY ("banks_id") REFERENCES "public"."banks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_credit_card_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_card"("id") ON DELETE cascade ON UPDATE no action;
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
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cards_fk" FOREIGN KEY ("cards_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_card_audit_logs_fk" FOREIGN KEY ("card_audit_logs_id") REFERENCES "public"."card_audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_roles_fk" FOREIGN KEY ("roles_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone");
  CREATE INDEX "users_authentication_provider_idx" ON "users" USING btree ("authentication_provider");
  CREATE INDEX "users_authentication_provider_id_idx" ON "users" USING btree ("authentication_provider_id");
  CREATE INDEX "users_profile_completed_idx" ON "users" USING btree ("profile_completed");
  CREATE INDEX "users_account_status_idx" ON "users" USING btree ("account_status");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_admin_id_idx" ON "users_rels" USING btree ("admin_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_rels_order_idx" ON "media_rels" USING btree ("order");
  CREATE INDEX "media_rels_parent_idx" ON "media_rels" USING btree ("parent_id");
  CREATE INDEX "media_rels_path_idx" ON "media_rels" USING btree ("path");
  CREATE INDEX "media_rels_admin_id_idx" ON "media_rels" USING btree ("admin_id");
  CREATE INDEX "admin_sessions_order_idx" ON "admin_sessions" USING btree ("_order");
  CREATE INDEX "admin_sessions_parent_id_idx" ON "admin_sessions" USING btree ("_parent_id");
  CREATE INDEX "admin_role_idx" ON "admin" USING btree ("role_id");
  CREATE INDEX "admin_updated_at_idx" ON "admin" USING btree ("updated_at");
  CREATE INDEX "admin_created_at_idx" ON "admin" USING btree ("created_at");
  CREATE UNIQUE INDEX "admin_email_idx" ON "admin" USING btree ("email");
  CREATE INDEX "admin_rels_order_idx" ON "admin_rels" USING btree ("order");
  CREATE INDEX "admin_rels_parent_idx" ON "admin_rels" USING btree ("parent_id");
  CREATE INDEX "admin_rels_path_idx" ON "admin_rels" USING btree ("path");
  CREATE INDEX "admin_rels_admin_id_idx" ON "admin_rels" USING btree ("admin_id");
  CREATE INDEX "otp_identifier_idx" ON "otp" USING btree ("identifier");
  CREATE INDEX "otp_updated_at_idx" ON "otp" USING btree ("updated_at");
  CREATE INDEX "otp_created_at_idx" ON "otp" USING btree ("created_at");
  CREATE INDEX "otp_deleted_at_idx" ON "otp" USING btree ("deleted_at");
  CREATE INDEX "otp_rels_order_idx" ON "otp_rels" USING btree ("order");
  CREATE INDEX "otp_rels_parent_idx" ON "otp_rels" USING btree ("parent_id");
  CREATE INDEX "otp_rels_path_idx" ON "otp_rels" USING btree ("path");
  CREATE INDEX "otp_rels_admin_id_idx" ON "otp_rels" USING btree ("admin_id");
  CREATE INDEX "gmail_connections_user_idx" ON "gmail_connections" USING btree ("user_id");
  CREATE INDEX "gmail_connections_gmail_address_idx" ON "gmail_connections" USING btree ("gmail_address");
  CREATE INDEX "gmail_connections_status_idx" ON "gmail_connections" USING btree ("status");
  CREATE INDEX "gmail_connections_connected_at_idx" ON "gmail_connections" USING btree ("connected_at");
  CREATE INDEX "gmail_connections_updated_at_idx" ON "gmail_connections" USING btree ("updated_at");
  CREATE INDEX "gmail_connections_created_at_idx" ON "gmail_connections" USING btree ("created_at");
  CREATE INDEX "gmail_connections_rels_order_idx" ON "gmail_connections_rels" USING btree ("order");
  CREATE INDEX "gmail_connections_rels_parent_idx" ON "gmail_connections_rels" USING btree ("parent_id");
  CREATE INDEX "gmail_connections_rels_path_idx" ON "gmail_connections_rels" USING btree ("path");
  CREATE INDEX "gmail_connections_rels_admin_id_idx" ON "gmail_connections_rels" USING btree ("admin_id");
  CREATE INDEX "statements_user_idx" ON "statements" USING btree ("user_id");
  CREATE INDEX "statements_issuer_idx" ON "statements" USING btree ("issuer");
  CREATE INDEX "statements_status_idx" ON "statements" USING btree ("status");
  CREATE INDEX "statements_pdf_idx" ON "statements" USING btree ("pdf_id");
  CREATE INDEX "statements_updated_at_idx" ON "statements" USING btree ("updated_at");
  CREATE INDEX "statements_created_at_idx" ON "statements" USING btree ("created_at");
  CREATE INDEX "statements_rels_order_idx" ON "statements_rels" USING btree ("order");
  CREATE INDEX "statements_rels_parent_idx" ON "statements_rels" USING btree ("parent_id");
  CREATE INDEX "statements_rels_path_idx" ON "statements_rels" USING btree ("path");
  CREATE INDEX "statements_rels_admin_id_idx" ON "statements_rels" USING btree ("admin_id");
  CREATE INDEX "banks_statement_config_statement_email_senders_order_idx" ON "banks_statement_config_statement_email_senders" USING btree ("_order");
  CREATE INDEX "banks_statement_config_statement_email_senders_parent_id_idx" ON "banks_statement_config_statement_email_senders" USING btree ("_parent_id");
  CREATE INDEX "banks_statement_config_statement_subject_patterns_order_idx" ON "banks_statement_config_statement_subject_patterns" USING btree ("_order");
  CREATE INDEX "banks_statement_config_statement_subject_patterns_parent_id_idx" ON "banks_statement_config_statement_subject_patterns" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "banks_name_idx" ON "banks" USING btree ("name");
  CREATE UNIQUE INDEX "banks_code_idx" ON "banks" USING btree ("code");
  CREATE INDEX "banks_logo_idx" ON "banks" USING btree ("logo_id");
  CREATE UNIQUE INDEX "banks_slug_idx" ON "banks" USING btree ("slug");
  CREATE INDEX "banks_updated_at_idx" ON "banks" USING btree ("updated_at");
  CREATE INDEX "banks_created_at_idx" ON "banks" USING btree ("created_at");
  CREATE INDEX "banks_deleted_at_idx" ON "banks" USING btree ("deleted_at");
  CREATE INDEX "banks__status_idx" ON "banks" USING btree ("_status");
  CREATE INDEX "banks_rels_order_idx" ON "banks_rels" USING btree ("order");
  CREATE INDEX "banks_rels_parent_idx" ON "banks_rels" USING btree ("parent_id");
  CREATE INDEX "banks_rels_path_idx" ON "banks_rels" USING btree ("path");
  CREATE INDEX "banks_rels_admin_id_idx" ON "banks_rels" USING btree ("admin_id");
  CREATE INDEX "_banks_v_version_statement_config_statement_email_senders_order_idx" ON "_banks_v_version_statement_config_statement_email_senders" USING btree ("_order");
  CREATE INDEX "_banks_v_version_statement_config_statement_email_senders_parent_id_idx" ON "_banks_v_version_statement_config_statement_email_senders" USING btree ("_parent_id");
  CREATE INDEX "_banks_v_version_statement_config_statement_subject_patterns_order_idx" ON "_banks_v_version_statement_config_statement_subject_patterns" USING btree ("_order");
  CREATE INDEX "_banks_v_version_statement_config_statement_subject_patterns_parent_id_idx" ON "_banks_v_version_statement_config_statement_subject_patterns" USING btree ("_parent_id");
  CREATE INDEX "_banks_v_parent_idx" ON "_banks_v" USING btree ("parent_id");
  CREATE INDEX "_banks_v_version_version_name_idx" ON "_banks_v" USING btree ("version_name");
  CREATE INDEX "_banks_v_version_version_code_idx" ON "_banks_v" USING btree ("version_code");
  CREATE INDEX "_banks_v_version_version_logo_idx" ON "_banks_v" USING btree ("version_logo_id");
  CREATE INDEX "_banks_v_version_version_slug_idx" ON "_banks_v" USING btree ("version_slug");
  CREATE INDEX "_banks_v_version_version_updated_at_idx" ON "_banks_v" USING btree ("version_updated_at");
  CREATE INDEX "_banks_v_version_version_created_at_idx" ON "_banks_v" USING btree ("version_created_at");
  CREATE INDEX "_banks_v_version_version_deleted_at_idx" ON "_banks_v" USING btree ("version_deleted_at");
  CREATE INDEX "_banks_v_version_version__status_idx" ON "_banks_v" USING btree ("version__status");
  CREATE INDEX "_banks_v_created_at_idx" ON "_banks_v" USING btree ("created_at");
  CREATE INDEX "_banks_v_updated_at_idx" ON "_banks_v" USING btree ("updated_at");
  CREATE INDEX "_banks_v_latest_idx" ON "_banks_v" USING btree ("latest");
  CREATE INDEX "_banks_v_autosave_idx" ON "_banks_v" USING btree ("autosave");
  CREATE INDEX "_banks_v_rels_order_idx" ON "_banks_v_rels" USING btree ("order");
  CREATE INDEX "_banks_v_rels_parent_idx" ON "_banks_v_rels" USING btree ("parent_id");
  CREATE INDEX "_banks_v_rels_path_idx" ON "_banks_v_rels" USING btree ("path");
  CREATE INDEX "_banks_v_rels_admin_id_idx" ON "_banks_v_rels" USING btree ("admin_id");
  CREATE INDEX "credit_card_eligibility_employment_types_order_idx" ON "credit_card_eligibility_employment_types" USING btree ("order");
  CREATE INDEX "credit_card_eligibility_employment_types_parent_idx" ON "credit_card_eligibility_employment_types" USING btree ("parent_id");
  CREATE UNIQUE INDEX "credit_card_slug_idx" ON "credit_card" USING btree ("slug");
  CREATE INDEX "credit_card_bank_idx" ON "credit_card" USING btree ("bank_id");
  CREATE INDEX "credit_card_image_idx" ON "credit_card" USING btree ("image_id");
  CREATE INDEX "credit_card_updated_at_idx" ON "credit_card" USING btree ("updated_at");
  CREATE INDEX "credit_card_created_at_idx" ON "credit_card" USING btree ("created_at");
  CREATE INDEX "credit_card_deleted_at_idx" ON "credit_card" USING btree ("deleted_at");
  CREATE INDEX "credit_card__status_idx" ON "credit_card" USING btree ("_status");
  CREATE INDEX "credit_card_rels_order_idx" ON "credit_card_rels" USING btree ("order");
  CREATE INDEX "credit_card_rels_parent_idx" ON "credit_card_rels" USING btree ("parent_id");
  CREATE INDEX "credit_card_rels_path_idx" ON "credit_card_rels" USING btree ("path");
  CREATE INDEX "credit_card_rels_admin_id_idx" ON "credit_card_rels" USING btree ("admin_id");
  CREATE INDEX "_credit_card_v_version_eligibility_employment_types_order_idx" ON "_credit_card_v_version_eligibility_employment_types" USING btree ("order");
  CREATE INDEX "_credit_card_v_version_eligibility_employment_types_parent_idx" ON "_credit_card_v_version_eligibility_employment_types" USING btree ("parent_id");
  CREATE INDEX "_credit_card_v_parent_idx" ON "_credit_card_v" USING btree ("parent_id");
  CREATE INDEX "_credit_card_v_version_version_slug_idx" ON "_credit_card_v" USING btree ("version_slug");
  CREATE INDEX "_credit_card_v_version_version_bank_idx" ON "_credit_card_v" USING btree ("version_bank_id");
  CREATE INDEX "_credit_card_v_version_version_image_idx" ON "_credit_card_v" USING btree ("version_image_id");
  CREATE INDEX "_credit_card_v_version_version_updated_at_idx" ON "_credit_card_v" USING btree ("version_updated_at");
  CREATE INDEX "_credit_card_v_version_version_created_at_idx" ON "_credit_card_v" USING btree ("version_created_at");
  CREATE INDEX "_credit_card_v_version_version_deleted_at_idx" ON "_credit_card_v" USING btree ("version_deleted_at");
  CREATE INDEX "_credit_card_v_version_version__status_idx" ON "_credit_card_v" USING btree ("version__status");
  CREATE INDEX "_credit_card_v_created_at_idx" ON "_credit_card_v" USING btree ("created_at");
  CREATE INDEX "_credit_card_v_updated_at_idx" ON "_credit_card_v" USING btree ("updated_at");
  CREATE INDEX "_credit_card_v_latest_idx" ON "_credit_card_v" USING btree ("latest");
  CREATE INDEX "_credit_card_v_autosave_idx" ON "_credit_card_v" USING btree ("autosave");
  CREATE INDEX "_credit_card_v_rels_order_idx" ON "_credit_card_v_rels" USING btree ("order");
  CREATE INDEX "_credit_card_v_rels_parent_idx" ON "_credit_card_v_rels" USING btree ("parent_id");
  CREATE INDEX "_credit_card_v_rels_path_idx" ON "_credit_card_v_rels" USING btree ("path");
  CREATE INDEX "_credit_card_v_rels_admin_id_idx" ON "_credit_card_v_rels" USING btree ("admin_id");
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
  CREATE INDEX "cards_user_idx" ON "cards" USING btree ("user_id");
  CREATE INDEX "cards_pan_last4_idx" ON "cards" USING btree ("pan_last4");
  CREATE INDEX "cards_pan_lookup_idx" ON "cards" USING btree ("pan_lookup");
  CREATE INDEX "cards_updated_at_idx" ON "cards" USING btree ("updated_at");
  CREATE INDEX "cards_created_at_idx" ON "cards" USING btree ("created_at");
  CREATE INDEX "cards_rels_order_idx" ON "cards_rels" USING btree ("order");
  CREATE INDEX "cards_rels_parent_idx" ON "cards_rels" USING btree ("parent_id");
  CREATE INDEX "cards_rels_path_idx" ON "cards_rels" USING btree ("path");
  CREATE INDEX "cards_rels_admin_id_idx" ON "cards_rels" USING btree ("admin_id");
  CREATE INDEX "card_audit_logs_action_idx" ON "card_audit_logs" USING btree ("action");
  CREATE INDEX "card_audit_logs_card_id_idx" ON "card_audit_logs" USING btree ("card_id");
  CREATE INDEX "card_audit_logs_actor_id_idx" ON "card_audit_logs" USING btree ("actor_id");
  CREATE INDEX "card_audit_logs_updated_at_idx" ON "card_audit_logs" USING btree ("updated_at");
  CREATE INDEX "card_audit_logs_created_at_idx" ON "card_audit_logs" USING btree ("created_at");
  CREATE INDEX "card_audit_logs_rels_order_idx" ON "card_audit_logs_rels" USING btree ("order");
  CREATE INDEX "card_audit_logs_rels_parent_idx" ON "card_audit_logs_rels" USING btree ("parent_id");
  CREATE INDEX "card_audit_logs_rels_path_idx" ON "card_audit_logs_rels" USING btree ("path");
  CREATE INDEX "card_audit_logs_rels_admin_id_idx" ON "card_audit_logs_rels" USING btree ("admin_id");
  CREATE INDEX "roles_permissions_order_idx" ON "roles_permissions" USING btree ("order");
  CREATE INDEX "roles_permissions_parent_idx" ON "roles_permissions" USING btree ("parent_id");
  CREATE INDEX "roles_visible_for_order_idx" ON "roles_visible_for" USING btree ("order");
  CREATE INDEX "roles_visible_for_parent_idx" ON "roles_visible_for" USING btree ("parent_id");
  CREATE UNIQUE INDEX "roles_name_idx" ON "roles" USING btree ("name");
  CREATE INDEX "roles_updated_at_idx" ON "roles" USING btree ("updated_at");
  CREATE INDEX "roles_created_at_idx" ON "roles" USING btree ("created_at");
  CREATE INDEX "roles_rels_order_idx" ON "roles_rels" USING btree ("order");
  CREATE INDEX "roles_rels_parent_idx" ON "roles_rels" USING btree ("parent_id");
  CREATE INDEX "roles_rels_path_idx" ON "roles_rels" USING btree ("path");
  CREATE INDEX "roles_rels_admin_id_idx" ON "roles_rels" USING btree ("admin_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
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
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_admin_id_idx" ON "payload_locked_documents_rels" USING btree ("admin_id");
  CREATE INDEX "payload_locked_documents_rels_otp_id_idx" ON "payload_locked_documents_rels" USING btree ("otp_id");
  CREATE INDEX "payload_locked_documents_rels_gmail_connections_id_idx" ON "payload_locked_documents_rels" USING btree ("gmail_connections_id");
  CREATE INDEX "payload_locked_documents_rels_statements_id_idx" ON "payload_locked_documents_rels" USING btree ("statements_id");
  CREATE INDEX "payload_locked_documents_rels_banks_id_idx" ON "payload_locked_documents_rels" USING btree ("banks_id");
  CREATE INDEX "payload_locked_documents_rels_credit_card_id_idx" ON "payload_locked_documents_rels" USING btree ("credit_card_id");
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
  CREATE INDEX "payload_locked_documents_rels_user_goals_id_idx" ON "payload_locked_documents_rels" USING btree ("user_goals_id");
  CREATE INDEX "payload_locked_documents_rels_cards_id_idx" ON "payload_locked_documents_rels" USING btree ("cards_id");
  CREATE INDEX "payload_locked_documents_rels_card_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("card_audit_logs_id");
  CREATE INDEX "payload_locked_documents_rels_roles_id_idx" ON "payload_locked_documents_rels" USING btree ("roles_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_rels_admin_id_idx" ON "payload_preferences_rels" USING btree ("admin_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "media_rels" CASCADE;
  DROP TABLE "admin_sessions" CASCADE;
  DROP TABLE "admin" CASCADE;
  DROP TABLE "admin_rels" CASCADE;
  DROP TABLE "otp" CASCADE;
  DROP TABLE "otp_rels" CASCADE;
  DROP TABLE "gmail_connections" CASCADE;
  DROP TABLE "gmail_connections_rels" CASCADE;
  DROP TABLE "statements" CASCADE;
  DROP TABLE "statements_rels" CASCADE;
  DROP TABLE "banks_statement_config_statement_email_senders" CASCADE;
  DROP TABLE "banks_statement_config_statement_subject_patterns" CASCADE;
  DROP TABLE "banks" CASCADE;
  DROP TABLE "banks_rels" CASCADE;
  DROP TABLE "_banks_v_version_statement_config_statement_email_senders" CASCADE;
  DROP TABLE "_banks_v_version_statement_config_statement_subject_patterns" CASCADE;
  DROP TABLE "_banks_v" CASCADE;
  DROP TABLE "_banks_v_rels" CASCADE;
  DROP TABLE "credit_card_eligibility_employment_types" CASCADE;
  DROP TABLE "credit_card" CASCADE;
  DROP TABLE "credit_card_rels" CASCADE;
  DROP TABLE "_credit_card_v_version_eligibility_employment_types" CASCADE;
  DROP TABLE "_credit_card_v" CASCADE;
  DROP TABLE "_credit_card_v_rels" CASCADE;
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
  DROP TABLE "cards" CASCADE;
  DROP TABLE "cards_rels" CASCADE;
  DROP TABLE "card_audit_logs" CASCADE;
  DROP TABLE "card_audit_logs_rels" CASCADE;
  DROP TABLE "roles_permissions" CASCADE;
  DROP TABLE "roles_visible_for" CASCADE;
  DROP TABLE "roles" CASCADE;
  DROP TABLE "roles_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_authentication_provider";
  DROP TYPE "public"."enum_users_employment_type";
  DROP TYPE "public"."enum_users_account_status";
  DROP TYPE "public"."enum_otp_channel";
  DROP TYPE "public"."enum_gmail_connections_status";
  DROP TYPE "public"."enum_statements_source";
  DROP TYPE "public"."enum_statements_status";
  DROP TYPE "public"."enum_banks_statement_config_parser_type";
  DROP TYPE "public"."enum_banks_data_source";
  DROP TYPE "public"."enum_banks_status";
  DROP TYPE "public"."enum__banks_v_version_statement_config_parser_type";
  DROP TYPE "public"."enum__banks_v_version_data_source";
  DROP TYPE "public"."enum__banks_v_version_status";
  DROP TYPE "public"."enum_credit_card_eligibility_employment_types";
  DROP TYPE "public"."enum_credit_card_card_type";
  DROP TYPE "public"."enum_credit_card_network";
  DROP TYPE "public"."enum_credit_card_state";
  DROP TYPE "public"."enum_credit_card_base_reward_type";
  DROP TYPE "public"."enum_credit_card_status";
  DROP TYPE "public"."enum__credit_card_v_version_eligibility_employment_types";
  DROP TYPE "public"."enum__credit_card_v_version_card_type";
  DROP TYPE "public"."enum__credit_card_v_version_network";
  DROP TYPE "public"."enum__credit_card_v_version_state";
  DROP TYPE "public"."enum__credit_card_v_version_base_reward_type";
  DROP TYPE "public"."enum__credit_card_v_version_status";
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
  DROP TYPE "public"."enum_cards_brand";
  DROP TYPE "public"."enum_card_audit_logs_action";
  DROP TYPE "public"."enum_card_audit_logs_actor_type";
  DROP TYPE "public"."enum_roles_permissions";
  DROP TYPE "public"."enum_roles_visible_for";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";`)
}
