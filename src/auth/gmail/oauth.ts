import { randomHex } from '@/auth/code'
import { AuthorizationError } from '@/auth/services/otpService'
import { env } from '@/lib/env'
import {
  GMAIL_TOKEN_URL,
  GMAIL_AUTH_URL,
  GMAIL_REVOKE_URL,
  GMAIL_OAUTH_STATE_TTL_MS,
  GMAIL_SCOPES,
  GMAIL_USERINFO_URL,
} from '@/auth/gmail/constants'
import type { GmailTokens } from '@/auth/gmail/types'

const clientId = () => env.GOOGLE_OAUTH_CLIENT_ID || ''
const clientSecret = () => env.GOOGLE_OAUTH_CLIENT_SECRET || ''

/**
 * Resolve the redirect URI for the Gmail OAuth callback.
 * Falls back to the server URL + `/api/users/gmail/callback`.
 */
const gmailRedirectUri = (): string => {
  if (env.GOOGLE_GMAIL_REDIRECT_URI) return env.GOOGLE_GMAIL_REDIRECT_URI
  return `${env.NEXT_PUBLIC_SERVER_URL}/api/users/gmail/callback`
}

/** Whether Gmail OAuth is configured (client ID + secret present). */
export const gmailOAuthEnabled = (): boolean => Boolean(clientId() && clientSecret())
 
export interface GmailConsentIntent {
  persist_derived: boolean
}

interface GmailStateRecord {
  userId: number
  expiry: number
  consentIntent?: GmailConsentIntent
}

/**
 * In-memory state store for CSRF protection during the Gmail OAuth flow.
 * Maps `state` → `{ userId, expiry, consentIntent }`.
 *
 * The user ID and server-side consent choices are tied to the CSRF nonce so
 * the callback can verify that the OAuth response belongs to the same user who
 * initiated the flow and finalize the exact consent preferences without
 * trusting client-controlled parameters.
 */
const gmailStateStore = new Map<string, GmailStateRecord>()

export interface GmailOAuthUrlResult {
  url: string
  state: string
}

/**
 * Build the Google OAuth 2.0 authorization URL for Gmail access.
 *
 * Requests `gmail.readonly` in addition to `openid email profile`
 * so that, on first consent, we can both identify the Gmail address
 * and read statements.
 *
 * `access_type=offline` ensures a refresh token is issued.
 * `prompt=consent` forces the consent screen so a refresh token
 * is always returned (Google only returns a refresh token on the
 * first consent otherwise).
 */
export const createGmailOAuthUrl = (
  userId: number,
  consentIntent?: GmailConsentIntent,
): GmailOAuthUrlResult => {
  if (!gmailOAuthEnabled()) {
    throw new AuthorizationError('GMAIL_OAUTH_DISABLED', 'Gmail integration is not configured.', 501)
  }

  const resolvedRedirectUri = gmailRedirectUri()
  const state = randomHex(16)
  const now = Date.now()
  gmailStateStore.set(state, { userId, expiry: now + GMAIL_OAUTH_STATE_TTL_MS, consentIntent })

  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: resolvedRedirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES,
    state,
    access_type: 'offline',
    prompt: 'consent',
  })

  return { url: `${GMAIL_AUTH_URL}?${params.toString()}`, state }
}

/**
 * Validate the OAuth state parameter returned by Google against the
 * value stored when the flow was initiated.
 *
 * Throws `AuthorizationError` if the state is missing, expired, or
 * does not match the requesting user.
 *
 * Returns any server-side consent intent associated with this state session.
 */
export const validateGmailState = (
  state: string,
  userId: number,
): GmailConsentIntent | undefined => {
  if (!state) {
    throw new AuthorizationError('INVALID_STATE', 'Missing OAuth state parameter.', 400)
  }
  const record = gmailStateStore.get(state)
  if (!record || Date.now() > record.expiry) {
    throw new AuthorizationError('INVALID_STATE', 'Invalid or expired OAuth state.', 400)
  }
  if (record.userId !== userId) {
    throw new AuthorizationError(
      'INVALID_STATE',
      'OAuth state does not match the current user.',
      403,
    )
  }
  const consentIntent = record.consentIntent
  gmailStateStore.delete(state)
  return consentIntent
}

/**
 * Exchange the authorization code returned by Google for access and
 * refresh tokens.
 */
export const exchangeGmailCode = async (code: string): Promise<GmailTokens> => {
  const resolvedRedirectUri = gmailRedirectUri()
  const body = new URLSearchParams({
    code,
    client_id: clientId(),
    client_secret: clientSecret(),
    redirect_uri: resolvedRedirectUri,
    grant_type: 'authorization_code',
  })

  const response = await fetch(GMAIL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>
    const description =
      (errorData.error_description as string) || 'Failed to exchange authorization code for tokens.'
    if (response.status === 400 || response.status === 401) {
      throw new AuthorizationError('GMAIL_TOKEN_EXCHANGE_FAILED', description, 401)
    }
    throw new AuthorizationError('GMAIL_TOKEN_EXCHANGE_FAILED', description, response.status)
  }

  const data = (await response.json()) as Record<string, unknown>
  const accessToken = data.access_token as string | undefined
  const refreshToken = data.refresh_token as string | undefined

  if (!accessToken) {
    throw new AuthorizationError(
      'GMAIL_TOKEN_EXCHANGE_FAILED',
      'No access token returned by Google.',
      401,
    )
  }

  if (!refreshToken) {
    throw new AuthorizationError(
      'GMAIL_NO_REFRESH_TOKEN',
      'A refresh token was not returned. Please revoke Google access for CardMax and try connecting again.',
      401,
    )
  }

  const expiresIn = Number(data.expires_in) || 3600
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    scope: (data.scope as string) || GMAIL_SCOPES,
    tokenType: (data.token_type as string) || 'Bearer',
  }
}

/**
 * Refresh an expired access token using the stored refresh token.
 *
 * Returns a new access token and its expiry timestamp.
 * Throws `AuthorizationError` (GMAIL_TOKEN_REFRESH_FAILED) if the
 * refresh token is invalid — the caller should disconnect the user.
 */
export const refreshGmailAccessToken = async (
  refreshToken: string,
): Promise<{ accessToken: string; expiresAt: number }> => {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId(),
    client_secret: clientSecret(),
    grant_type: 'refresh_token',
  })

  const response = await fetch(GMAIL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>
    const description =
      (errorData.error_description as string) || 'Failed to refresh access token.'
    if (response.status === 400 || response.status === 401) {
      throw new AuthorizationError('GMAIL_TOKEN_REFRESH_FAILED', description, 401)
    }
    throw new AuthorizationError('GMAIL_TOKEN_REFRESH_FAILED', description, response.status)
  }

  const data = (await response.json()) as Record<string, unknown>
  const accessToken = data.access_token as string | undefined
  if (!accessToken) {
    throw new AuthorizationError('GMAIL_TOKEN_REFRESH_FAILED', 'No access token returned.', 502)
  }

  const expiresIn = Number(data.expires_in) || 3600
  return {
    accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}

/**
 * Fetch the Gmail address of the authenticated user via the
 * Google userinfo endpoint. Returns `null` on failure.
 */
export const fetchGmailAddress = async (accessToken: string): Promise<string | null> => {
  try {
    const response = await fetch(GMAIL_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (response.ok) {
      const data = (await response.json()) as { email?: string; emailAddress?: string }
      return data.email || data.emailAddress || null
    }
  } catch {
    // Non-fatal
  }
  return null
}

/**
 * Revoke a token (access or refresh) at Google's revocation endpoint.
 * Best-effort: network or HTTP errors are swallowed.
 */
export const revokeGmailToken = async (token: string): Promise<void> => {
  const body = new URLSearchParams({ token })
  try {
    await fetch(GMAIL_REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  } catch {
    // Best-effort revocation — ignore network errors
  }
}

/** Clear all stored OAuth states (used in tests / cleanup). */
export const clearAllGmailStates = (): void => {
  gmailStateStore.clear()
}

