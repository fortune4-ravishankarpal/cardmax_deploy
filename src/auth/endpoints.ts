import type { PayloadRequest } from 'payload'

import { sendOtpSchema, verifyOtpSchema, completeProfileSchema } from '@/auth/validation/schemas'
import { requestOtp, verifyOtp, AuthorizationError } from '@/auth/services/otpService'
import { findOrCreateByIdentifier, findOrCreateByGoogleProfile } from '@/auth/services/userService'
import { issueSession, buildSessionCookie, clearSessionCookie } from '@/auth/services/authService'
import {
  isProfileComplete,
  completeUserProfile,
} from '@/auth/services/profileService'
import {
  createOAuthUrl,
  validateAndConsumeState,
  authorizeGoogleOAuth,
} from '@/auth/google/oauth'
import type { User } from '@/payload-types'
import { hasRequiredConsent } from '@/auth/guard'

const json = (data: unknown, status = 200, cookie?: string): Response => {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (cookie) headers.set('Set-Cookie', cookie)
  return new Response(JSON.stringify(data), { status, headers })
}

const isValidationError = (e: unknown): boolean =>
  Boolean(e && typeof e === 'object' && 'issues' in (e as any))

const errorResponse = (e: unknown): Response => {
  if (e instanceof AuthorizationError) {
    return json({ error: e.message, code: e.code }, e.status)
  }
  if (isValidationError(e)) {
    return json({ error: 'Invalid input.', code: 'VALIDATION_ERROR' }, 400)
  }
  return json({ error: 'Something went wrong. Please try again.', code: 'INTERNAL' }, 500)
}

const jsonBody = async (req: PayloadRequest): Promise<any> => {
  if (typeof req.json !== 'function') return {}
  try {
    return await req.json()
  } catch {
    return {}
  }
}

export const sendOtpHandler = async (req: PayloadRequest): Promise<Response> => {
  const body = await jsonBody(req)
  const parsed = sendOtpSchema.safeParse(body)
  if (!parsed.success) return errorResponse({ issues: parsed.error.issues })
  const { identifier } = parsed.data

  try {
    const result = await requestOtp(req.payload, identifier)
    return json(result)
  } catch (e) {
    return errorResponse(e)
  }
}

export const verifyOtpHandler = async (req: PayloadRequest): Promise<Response> => {
  const body = await jsonBody(req)
  const parsed = verifyOtpSchema.safeParse(body)
  if (!parsed.success) return errorResponse({ issues: parsed.error.issues })
  const { identifier, code, name } = parsed.data

  try {
    const verified = await verifyOtp(req.payload, identifier, code)
    const { identifier: accountKey, channel } = verified
    const { user } = await findOrCreateByIdentifier(req.payload, {
      channel,
      identifier: accountKey,
      provider: channel,
      name,
    })
    const session = await issueSession(req.payload, user as User)
    return json(
      {
        id: user.id,
        email: user.email,
        name: user.name || null,
        profileComplete: isProfileComplete(user as User),
        consentRequired: !hasRequiredConsent(user as User),
      },
      200,
      buildSessionCookie(session.token!),
    )
  } catch (e) {
    return errorResponse(e)
  }
}

export const completeProfileHandler = async (req: PayloadRequest): Promise<Response> => {
  if (!req.user) {
    return json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, 401)
  }
  const body = await jsonBody(req)
  const parsed = completeProfileSchema.safeParse(body)
  if (!parsed.success) return errorResponse({ issues: parsed.error.issues })

  try {
    const updated = await completeUserProfile(req.payload, req.user as User, parsed.data)
    return json({
      id: updated.id,
      email: updated.email,
      profileComplete: isProfileComplete(updated as User),
    })
  } catch (e) {
    return errorResponse(e)
  }
}

export const logoutHandler = async (_req: PayloadRequest): Promise<Response> => {
  return json({ ok: true }, 200, clearSessionCookie())
}

const resolvePostAuthRedirect = (user: User): string => {
  if (!hasRequiredConsent(user)) return '/consent-onboarding'
  if (!user.profileCompleted && !(user.name && (user.email || user.phone))) return '/complete-profile'
  return '/'
}

const createRedirect = (location: string, cookie?: string): Response => {
  const headers = new Headers({ Location: location })
  if (cookie) headers.set('Set-Cookie', cookie)
  return new Response(null, { status: 302, headers })
}

export const googleLoginHandler = async (_req: PayloadRequest): Promise<Response> => {
  try {
    const { url } = createOAuthUrl()
    return new Response(null, { status: 307, headers: { Location: url } })
  } catch (e) {
    const err = e as AuthorizationError
    return json({ error: err.message, code: err.code }, err.status || 501)
  }
}

export const googleCallbackHandler = async (req: PayloadRequest): Promise<Response> => {
  const url = new URL(req.url || '')
  const code = url.searchParams.get('code') || ''
  const state = url.searchParams.get('state') || ''

  if (!code) {
    return json({ error: 'Google sign-in was cancelled.', code: 'OAUTH_CANCELLED' }, 400)
  }

  try {
    validateAndConsumeState(state)
    const profile = await authorizeGoogleOAuth(req.payload, code)
    const { user } = await findOrCreateByGoogleProfile(req.payload, profile)
    const session = await issueSession(req.payload, user as User)
    const cookie = buildSessionCookie(session.token!)
    return createRedirect(resolvePostAuthRedirect(user as User), cookie)
  } catch (e) {
    const err = e as AuthorizationError
    const reason = encodeURIComponent((err && err.message) || 'Google sign-in failed.')
    return createRedirect(`/login?error=${reason}`)
  }
}

export const isProfileCompleted = (user: User): boolean => {
  return isProfileComplete(user)
}