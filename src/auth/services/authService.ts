import type { Payload } from 'payload'

import { COOKIE_NAME, COOKIE_SECURE, COOKIE_SAME_SITE, SESSION_MAX_AGE_SECONDS } from '@/auth/constants'
import { randomHex } from '@/auth/code'
import { AuthorizationError } from '@/auth/services/otpService'
import type { User } from '@/payload-types'

export const issueSession = async (payload: Payload, user: User) => {
  if (user.accountStatus === 'suspended' || user.accountStatus === 'pending') {
    throw new AuthorizationError('ACCOUNT_UNAVAILABLE', 'Authentication failed.', 401)
  }

  const email = user.email
  const oneTimePassword = randomHex(32)

  await payload.update({
    collection: 'users',
    id: user.id,
    data: { password: oneTimePassword },
    overrideAccess: true,
  })

  const result = await payload.login({
    collection: 'users',
    data: { email, password: oneTimePassword },
  })

  if (!result || !result.token) {
    throw new AuthorizationError('SESSION_FAILED', 'Authentication failed.', 500)
  }

  return result
}

const asHeaderValue = (parts: string[]): string => parts.filter(Boolean).join('; ')

export const buildSessionCookie = (token: string, maxAgeSeconds = SESSION_MAX_AGE_SECONDS): string => {
  return asHeaderValue([
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    `SameSite=${COOKIE_SAME_SITE}`,
    COOKIE_SECURE ? 'Secure' : '',
    maxAgeSeconds > 0 ? `Max-Age=${maxAgeSeconds}` : '',
  ])
}

export const clearSessionCookie = (): string => {
  return asHeaderValue([`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', `SameSite=${COOKIE_SAME_SITE}`, 'Max-Age=0'])
}