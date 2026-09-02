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
  CREATE TYPE "public"."enum_roles_permissions" AS ENUM('*', '*.read', '*.create', '*.update', '*.delete', 'users.*', 'users.create', 'users.read', 'users.update', 'users.delete', 'users.manage', 'media.*', 'media.create', 'media.read', 'media.update', 'media.delete', 'media.manage', 'admin.*', 'admin.create', 'admin.read', 'admin.update', 'admin.delete', 'admin.manage', 'otp.*', 'otp.create', 'otp.read', 'otp.update', 'otp.delete', 'otp.manage', 'gmail-connections.*', 'gmail-connections.create', 'gmail-connections.read', 'gmail-connections.update', 'gmail-connections.delete', 'gmail-connections.manage', 'statements.*', 'statements.create', 'statements.read', 'statements.update', 'statements.delete', 'statements.manage', 'banks.*', 'banks.create', 'banks.read', 'banks.update', 'banks.delete', 'banks.manage', 'banks.publish', 'CreditCard.*', 'CreditCard.create', 'CreditCard.read', 'CreditCard.update', 'CreditCard.delete', 'CreditCard.manage', 'CreditCard.publish', 'roles.*', 'roles.create', 'roles.read', 'roles.update', 'roles.delete', 'roles.manage');
  CREATE TYPE "public"."enum_roles_visible_for" AS ENUM('users', 'admin');
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
  ALTER TABLE "roles_permissions" ADD CONSTRAINT "roles_permissions_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_visible_for" ADD CONSTRAINT "roles_visible_for_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_rels" ADD CONSTRAINT "roles_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "roles_rels" ADD CONSTRAINT "roles_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_otp_fk" FOREIGN KEY ("otp_id") REFERENCES "public"."otp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gmail_connections_fk" FOREIGN KEY ("gmail_connections_id") REFERENCES "public"."gmail_connections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_statements_fk" FOREIGN KEY ("statements_id") REFERENCES "public"."statements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_banks_fk" FOREIGN KEY ("banks_id") REFERENCES "public"."banks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_credit_card_fk" FOREIGN KEY ("credit_card_id") REFERENCES "public"."credit_card"("id") ON DELETE cascade ON UPDATE no action;
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
  DROP TABLE "roles_permissions" CASCADE;
  DROP TABLE "roles_visible_for" CASCADE;
  DROP TABLE "roles" CASCADE;
  DROP TABLE "roles_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
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
  DROP TYPE "public"."enum_roles_permissions";
  DROP TYPE "public"."enum_roles_visible_for";`)
}
