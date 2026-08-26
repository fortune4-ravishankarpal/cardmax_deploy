import { OTP_STATE_TTL_MS } from '@/auth/constants'
import { randomHex } from '@/auth/code'
import { AuthorizationError } from '@/auth/services/otpService'
import { env } from '@/lib/env'
import type { Payload } from 'payload'

export type GoogleProfile = {
  id: string
  email?: string
  name?: string
  picture?: string
}

const clientId = () => env.GOOGLE_OAUTH_CLIENT_ID || ''
const clientSecret = () => env.GOOGLE_OAUTH_CLIENT_SECRET || ''
const redirectUri = () => env.GOOGLE_OAUTH_REDIRECT_URI || `${env.NEXT_PUBLIC_SERVER_URL}/api/users/google/callback`

export const googleEnabled = (): boolean => Boolean(clientId() && clientSecret())

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'
const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

const stateStore = new Map<string, number>()

export const createOAuthUrl = (): { url: string; state: string } => {
  if (!googleEnabled()) {
    throw new AuthorizationError('GOOGLE_DISABLED', 'Google sign-in is not configured.', 501)
  }

  const state = randomHex(16)
  const now = Date.now()
  stateStore.set(state, now + OTP_STATE_TTL_MS)

  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })

  return { url: `${AUTH_URL}?${params.toString()}`, state }
}

export const validateAndConsumeState = (state: string): void => {
  if (!state) {
    throw new AuthorizationError('INVALID_STATE', 'Invalid OAuth state.', 400)
  }
  const expiry = stateStore.get(state)
  if (!expiry || Date.now() > expiry) {
    throw new AuthorizationError('INVALID_STATE', 'Invalid OAuth state.', 400)
  }
  stateStore.delete(state)
}

const exchangeCode = async (code: string): Promise<string> => {
  const body = new URLSearchParams({
    code,
    client_id: clientId(),
    client_secret: clientSecret(),
    redirect_uri: redirectUri(),
    grant_type: 'authorization_code',
  })

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    throw new AuthorizationError('OAUTH_FAILED', 'Google sign-in failed.', 401)
  }

  const data = await response.json()
  const accessToken = data.access_token as string | undefined
  if (!accessToken) {
    throw new AuthorizationError('OAUTH_FAILED', 'Google sign-in failed.', 401)
  }
  return accessToken
}

const getUserProfile = async (accessToken: string): Promise<GoogleProfile> => {
  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new AuthorizationError('OAUTH_FAILED', 'Google sign-in failed.', 401)
  }

  const data = (await response.json()) as Record<string, unknown>
  const id = String(data.id || '')
  if (!id) {
    throw new AuthorizationError('OAUTH_FAILED', 'Google sign-in failed.', 401)
  }

  return {
    id,
    email: typeof data.email === 'string' ? data.email : undefined,
    name: typeof data.name === 'string' ? data.name : undefined,
    picture: typeof data.picture === 'string' ? data.picture : undefined,
  }
}

export const authorizeGoogleOAuth = async (
  _payload: Payload,
  code: string,
): Promise<GoogleProfile> => {
  const accessToken = await exchangeCode(code)
  return getUserProfile(accessToken)
}