import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    // Core
    PAYLOAD_SECRET: z.string().min(1),
    DATABASE_URL: z.string().min(1),

    // OTP login
    OTP_PROVIDER: z.enum(['console', 'email', 'sms']).default('console'),
    OTP_CODE_LENGTH: z.coerce.number().int().min(4).max(10).default(6),
    OTP_EXPIRY_MS: z.coerce.number().int().positive().default(5 * 60 * 1000),
    OTP_RESEND_COOLDOWN_MS: z.coerce.number().int().positive().default(30 * 1000),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    OTP_SEND_WINDOW_MS: z.coerce.number().int().positive().default(60 * 1000),
    OTP_SEND_MAX_PER_WINDOW: z.coerce.number().int().positive().default(3),
    OTP_STATE_TTL_MS: z.coerce.number().int().positive().default(10 * 60 * 1000),
    OTP_EMAIL_FROM: z.string().min(1).default('CardMax <no-reply@cardmax.local>'),

    // SMS provider (optional, falls back to console provider when unset)
    OTP_SMS_PROVIDER: z.string().min(1).default('twilio'),
    OTP_SMS_ACCOUNT_SID: z.string().min(1).optional(),
    OTP_SMS_AUTH_TOKEN: z.string().min(1).optional(),
    OTP_SMS_FROM: z.string().min(1).optional(),
    // Google OAuth
    GOOGLE_OAUTH_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
    GOOGLE_OAUTH_REDIRECT_URI: z.string().url().optional(),
    // Gmail statement ingestion
    GMAIL_ENCRYPTION_KEY: z.string().min(1).optional(),
    GOOGLE_GMAIL_REDIRECT_URI: z.string().url().optional(),
    STATEMENT_PARSER_ENDPOINT: z.string().url().optional(),
    GMAIL_ISSUER_PATTERNS: z.string().min(1).optional(),

    // Cards
    CARD_ENCRYPTION_KEYS: z.string().min(1).optional(),
    CARD_ENCRYPTION_KEY: z.string().min(1).optional(),
    CARD_ENCRYPTION_CURRENT_KEY_VERSION: z.string().min(1).optional(),

    // Indian PAN (Permanent Account Number)
    PAN_ENCRYPTION_KEYS: z.string().min(1).optional(),
    PAN_ENCRYPTION_KEY: z.string().min(1).optional(),
    PAN_ENCRYPTION_CURRENT_KEY_VERSION: z.string().min(1).optional(),

    // Sessions & cookies
    SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 30),
    COOKIE_SECURE: z
      .enum(['true', 'false', '1', '0'])
      .default(process.env.NODE_ENV === 'production' ? 'true' : 'false')
      .transform((value) => value === 'true' || value === '1'),
    COOKIE_SAME_SITE: z.enum(['Lax', 'Strict', 'None']).default('Lax'),
    COOKIE_NAME: z.string().min(1).default('payload-token'),

    // Misc
    CRON_SECRET: z.string().min(1).optional(),
    VERCEL_PROJECT_PRODUCTION_URL: z.string().min(1).optional(),

    // Payment & Max Pro
    RAZORPAY_KEY_ID: z.string().min(1),
    RAZORPAY_KEY_SECRET: z.string().min(1),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
    MAX_PRO_GRACE_PERIOD_DAYS: z.coerce.number().int().default(7),



    // SMTP
    SMTP_USER: z.string().min(1),
    SMTP_PASS: z.string().min(1),
    SMTP_HOST: z.string().min(1),
    FROM_EMAIL: z.string().min(1),
    SUPPORT_EMAIL: z.string().min(1),
    SALES_EMAIL: z.string().min(1),

    CMS_SEED_ADMIN_EMAIL: z.email().min(1),
    CMS_SEED_ADMIN_PASSWORD: z.string().min(4),

    // Notifications
    NOTIFICATION_MODE: z.enum(['simulation', 'live']).default('simulation'),
    EMAIL_PROVIDER: z.enum(['smtp', 'resend', 'mock']).default('smtp'),
    RESEND_API_KEY: z.string().min(1).optional(),

    // FCM (Firebase Cloud Messaging) – Android push
    FCM_PROJECT_ID: z.string().min(1).optional(),
    FCM_CLIENT_EMAIL: z.string().min(1).optional(),
    FCM_PRIVATE_KEY: z.string().min(1).optional(),

    // APNs (Apple Push Notification service) – iOS push
    APNS_KEY_ID: z.string().min(1).optional(),
    APNS_TEAM_ID: z.string().min(1).optional(),
    APNS_KEY: z.string().min(1).optional(),
    APNS_TOPIC: z.string().min(1).optional(),

    // DKIM email signing
    DKIM_DOMAIN: z.string().min(1).optional(),
    DKIM_KEY_SELECTOR: z.string().min(1).optional(),
    DKIM_PRIVATE_KEY: z.string().min(1).optional(),
  },

  client: {
    NEXT_PUBLIC_SERVER_URL: z.string().url().default('http://localhost:3000'),
  },

  runtimeEnv: {
    // Core
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,

    // OTP
    OTP_PROVIDER: process.env.OTP_PROVIDER,
    OTP_CODE_LENGTH: process.env.OTP_CODE_LENGTH,
    OTP_EXPIRY_MS: process.env.OTP_EXPIRY_MS,
    OTP_RESEND_COOLDOWN_MS: process.env.OTP_RESEND_COOLDOWN_MS,
    OTP_MAX_ATTEMPTS: process.env.OTP_MAX_ATTEMPTS,
    OTP_SEND_WINDOW_MS: process.env.OTP_SEND_WINDOW_MS,
    OTP_SEND_MAX_PER_WINDOW: process.env.OTP_SEND_MAX_PER_WINDOW,
    OTP_STATE_TTL_MS: process.env.OTP_STATE_TTL_MS,
    OTP_EMAIL_FROM: process.env.OTP_EMAIL_FROM,

    // SMS
    OTP_SMS_PROVIDER: process.env.OTP_SMS_PROVIDER,
    OTP_SMS_ACCOUNT_SID: process.env.OTP_SMS_ACCOUNT_SID,
    OTP_SMS_AUTH_TOKEN: process.env.OTP_SMS_AUTH_TOKEN,
    OTP_SMS_FROM: process.env.OTP_SMS_FROM,

    // Google
    GOOGLE_OAUTH_CLIENT_ID: process.env.GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI: process.env.GOOGLE_OAUTH_REDIRECT_URI,
    // Gmail
    GMAIL_ENCRYPTION_KEY: process.env.GMAIL_ENCRYPTION_KEY,
    GOOGLE_GMAIL_REDIRECT_URI: process.env.GOOGLE_GMAIL_REDIRECT_URI,
    STATEMENT_PARSER_ENDPOINT: process.env.STATEMENT_PARSER_ENDPOINT,
    GMAIL_ISSUER_PATTERNS: process.env.GMAIL_ISSUER_PATTERNS,

    // Cards
    CARD_ENCRYPTION_KEYS: process.env.CARD_ENCRYPTION_KEYS,
    CARD_ENCRYPTION_KEY: process.env.CARD_ENCRYPTION_KEY,
    CARD_ENCRYPTION_CURRENT_KEY_VERSION: process.env.CARD_ENCRYPTION_CURRENT_KEY_VERSION,

    // Indian PAN (Permanent Account Number)
    PAN_ENCRYPTION_KEYS: process.env.PAN_ENCRYPTION_KEYS,
    PAN_ENCRYPTION_KEY: process.env.PAN_ENCRYPTION_KEY,
    PAN_ENCRYPTION_CURRENT_KEY_VERSION: process.env.PAN_ENCRYPTION_CURRENT_KEY_VERSION,

    // Sessions & cookies
    SESSION_MAX_AGE_SECONDS: process.env.SESSION_MAX_AGE_SECONDS,
    COOKIE_SECURE: process.env.COOKIE_SECURE,
    COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE,
    COOKIE_NAME: process.env.COOKIE_NAME,

    // Misc
    CRON_SECRET: process.env.CRON_SECRET,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,

    // Payment & Max Pro
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    MAX_PRO_GRACE_PERIOD_DAYS: process.env.MAX_PRO_GRACE_PERIOD_DAYS,

    // Client
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,


    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_HOST: process.env.SMTP_HOST,
    FROM_EMAIL: process.env.FROM_EMAIL,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    SALES_EMAIL: process.env.SALES_EMAIL,

    CMS_SEED_ADMIN_EMAIL: process.env.CMS_SEED_ADMIN_EMAIL,
    CMS_SEED_ADMIN_PASSWORD: process.env.CMS_SEED_ADMIN_PASSWORD,

    // Notifications
    NOTIFICATION_MODE: process.env.NOTIFICATION_MODE,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    RESEND_API_KEY: process.env.RESEND_API_KEY,

    // FCM
    FCM_PROJECT_ID: process.env.FCM_PROJECT_ID,
    FCM_CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL,
    FCM_PRIVATE_KEY: process.env.FCM_PRIVATE_KEY,

    // APNs
    APNS_KEY_ID: process.env.APNS_KEY_ID,
    APNS_TEAM_ID: process.env.APNS_TEAM_ID,
    APNS_KEY: process.env.APNS_KEY,
    APNS_TOPIC: process.env.APNS_TOPIC,

    // DKIM
    DKIM_DOMAIN: process.env.DKIM_DOMAIN,
    DKIM_KEY_SELECTOR: process.env.DKIM_KEY_SELECTOR,
    DKIM_PRIVATE_KEY: process.env.DKIM_PRIVATE_KEY,
  },

  emptyStringAsUndefined: true,

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  onValidationError(issues) {
    const errorMessage = issues
      .map((issue) => {
        const path = Array.from(issue.path ?? []).map(String).join('.') || 'env'
        return `  - ${path}: ${issue.message}`
      })
      .join('\n')

    console.error(`\n\nPlease check the environment variables:\n${errorMessage}`)
    throw new Error(`Invalid environment variables:\n${errorMessage}`)
  },
})
