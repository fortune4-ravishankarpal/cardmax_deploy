import type { User } from '@/payload-types'
import { AuthorizationError } from '@/auth/services/otpService'
import { CURRENT_TOS_VERSION, CURRENT_PRIVACY_VERSION } from '@/lib/consentVersions'

/**
 * Checks whether a user has provided the required Terms of Service
 * acceptance and Privacy Notice acknowledgement with the currently active versions.
 */
export function hasRequiredConsent(user: User | null | undefined): boolean {
  if (!user) return false

  const hasValidTos = Boolean(
    user.acceptedTermsAndConditions === true &&
    user.tosVersion &&
    user.tosVersion === CURRENT_TOS_VERSION,
  )

  const hasValidPrivacy = Boolean(
    user.acceptedPrivacyPolicy === true &&
    user.privacyNoticeVersion &&
    user.privacyNoticeVersion === CURRENT_PRIVACY_VERSION,
  )

  return hasValidTos && hasValidPrivacy
}

/**
 * API-level authorization guard for protected endpoints.
 * Throws 401 if unauthenticated, 403 if required consent is missing/outdated.
 */
export function requireConsentApi(user: User | null | undefined): void {
  if (!user) {
    throw new AuthorizationError('UNAUTHENTICATED', 'Authentication required.', 401)
  }

  if (!hasRequiredConsent(user)) {
    throw new AuthorizationError(
      'CONSENT_REQUIRED',
      'You must review and accept the required Terms of Service and Privacy Notice before accessing this resource.',
      403,
    )
  }
}
