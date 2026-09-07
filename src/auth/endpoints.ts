import { ValidationError, type PayloadRequest } from 'payload'

import {
  sendOtpSchema,
  verifyOtpSchema,
  completeProfileSchema,
  updateProfileSchema,
} from '@/auth/validation/schemas'
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
  console.error('[Auth Error]', e)
  if (e instanceof AuthorizationError) {
    return json({ error: e.message, code: e.code }, e.status)
  }
  if (e instanceof ValidationError || (e && typeof e === 'object' && (e as any).name === 'ValidationError')) {
    const message = (e as any).errors?.[0]?.message || (e as any).message || 'Validation failed.'
    return json({ error: message, code: 'VALIDATION_ERROR' }, 400)
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
  return '/profile'
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

export const getProfileHandler = async (req: PayloadRequest): Promise<Response> => {
  if (!req.user || req.user.collection !== 'users') {
    return json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, 401)
  }

  try {
    const user = await req.payload.findByID({
      collection: 'users',
      id: req.user.id,
      depth: 0,
      overrideAccess: true,
    })

    if (!user) {
      return json({ error: 'User not found', code: 'NOT_FOUND' }, 404)
    }

    const cardsResult = await req.payload.find({
      collection: 'user-cards',
      where: {
        user: { equals: req.user.id },
      },
      limit: 100,
      overrideAccess: true,
    })

    const subscriptionsResult = await req.payload.find({
      collection: 'subscriptions',
      where: {
        user: { equals: req.user.id },
      },
      sort: '-createdAt',
      limit: 1,
      overrideAccess: true,
    })

    const activeSubscription = subscriptionsResult.docs[0] || null

    return json({
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      income: user.income != null ? user.income : null,
      employmentType: user.employmentType || null,
      authenticationProvider: user.authenticationProvider || 'email',
      profileCompleted: Boolean(user.profileCompleted),
      accountStatus: user.accountStatus || 'active',
      createdAt: user.createdAt,
      marketingConsent: Boolean(user.marketingConsent),
      stats: {
        activeCardsCount: cardsResult.docs.filter((c: any) => c.status === 'active').length,
        totalCardsCount: cardsResult.totalDocs || 0,
        subscriptionStatus: activeSubscription ? (activeSubscription as any).status : 'free',
      },
    })
  } catch (e) {
    return errorResponse(e)
  }
}

export const updateProfileHandler = async (req: PayloadRequest): Promise<Response> => {
  if (!req.user || req.user.collection !== 'users') {
    return json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, 401)
  }

  const body = await jsonBody(req)
  const parsed = updateProfileSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse({ issues: parsed.error.issues })
  }

  const { name, phone, income, employmentType } = parsed.data

  const updateData: Record<string, unknown> = {
    name,
  }

  if (phone !== undefined) {
    updateData.phone = phone ? phone.trim() : null
  }

  if (income !== undefined) {
    if (income === null || income === '') {
      updateData.income = null
    } else {
      const parsedIncome = typeof income === 'number' ? income : Number(income)
      if (Number.isNaN(parsedIncome) || parsedIncome < 0) {
        return json({ error: 'Please enter a valid monthly income.', code: 'INVALID_INCOME' }, 400)
      }
      updateData.income = parsedIncome
    }
  }

  if (employmentType !== undefined) {
    updateData.employmentType = employmentType ? employmentType.trim() : null
  }

  try {
    const updated = await req.payload.update({
      collection: 'users',
      id: req.user.id,
      data: updateData,
      overrideAccess: true,
      depth: 0,
    })

    return json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        income: updated.income,
        employmentType: updated.employmentType,
        authenticationProvider: updated.authenticationProvider,
        profileCompleted: updated.profileCompleted,
        accountStatus: updated.accountStatus,
      },
    })
  } catch (e) {
    return errorResponse(e)
  }
}
