import { env } from '@/lib/env'
import { OTP_STATE_TTL_MS } from '@/auth/constants'

/** Google OAuth 2.0 token endpoint. */
export const GMAIL_TOKEN_URL = 'https://oauth2.googleapis.com/token'

/** Google OAuth 2.0 authorization endpoint. */
export const GMAIL_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

/** Base URL for the Gmail REST API (v1). */
export const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users'

/** Google token revocation endpoint. */
export const GMAIL_REVOKE_URL = 'https://oauth2.googleapis.com/revoke'

/**
 * Scope requesting read-only access to the user's Gmail mailbox.
 * Combined with `openid email profile` so we can identify the Gmail address
 * on first connect.
 */
export const GMAIL_READONLY_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'
export const GMAIL_SCOPES = `${GMAIL_READONLY_SCOPE} openid email profile`

/** TTL for the in-memory OAuth state (CSRF nonce). */
export const GMAIL_OAUTH_STATE_TTL_MS = OTP_STATE_TTL_MS

/** Maximum number of PDF attachments to download per ingestion run. */
export const GMAIL_INGEST_MAX_PDFS = 20

/** Maximum number of Gmail messages to fetch per issuer-pattern search (per page). */
export const GMAIL_SEARCH_MAX_RESULTS = 50

/** Google userinfo endpoint — used as a fallback to resolve the Gmail address. */
export const GMAIL_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

/** Derive the encryption key from env, falling back to PAYLOAD_SECRET. */
export const getEncryptionKey = (): string => env.GMAIL_ENCRYPTION_KEY || env.PAYLOAD_SECRET
