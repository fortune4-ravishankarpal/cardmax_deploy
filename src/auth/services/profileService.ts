import type { Payload } from 'payload'

import type { User } from '@/payload-types'
import { findUserByEmail } from '@/auth/services/userService'
import { AuthorizationError } from '@/auth/services/otpService'
import { CURRENT_TOS_VERSION, CURRENT_PRIVACY_VERSION } from '@/lib/consentVersions'
import { encryptPan, isValidPan, normalizePan } from '@/auth/services/panCrypto'

export const isProfileComplete = (user: User | null): boolean => {
  if (!user) return false
  if (user.profileCompleted) return true
  const hasContact = Boolean(user.email || user.phone)
  const hasName = Boolean(user.name)
  return hasContact && hasName
}

export const completeUserProfile = async (payload: Payload, user: User, data: any) => {
  const name = typeof data?.name === 'string' ? data.name.trim() : ''
  if (!name) {
    throw new AuthorizationError('NAME_REQUIRED', 'Please provide your name.', 400)
  }

  const incomeRaw = data?.income
  const income =
    typeof incomeRaw === 'number'
      ? incomeRaw
      : typeof incomeRaw === 'string' && incomeRaw.trim() !== ''
        ? Number(incomeRaw)
        : undefined
  if (income !== undefined && (Number.isNaN(income) || income < 0)) {
    throw new AuthorizationError('INVALID_INCOME', 'Please provide a valid income.', 400)
  }

  const employmentType =
    typeof data?.employmentType === 'string' && data.employmentType.trim()
      ? data.employmentType.trim()
      : undefined

  const existingEmailTaken = data?.email
    ? await findUserByEmail(payload, String(data.email).toLowerCase())
    : null
  if (existingEmailTaken && existingEmailTaken.id !== user.id) {
    throw new AuthorizationError('EMAIL_IN_USE', 'That email is already in use.', 409)
  }

  const now = new Date().toISOString()

  const payloadUpdateData: Record<string, unknown> = {
    name,
    profileCompleted: true,
    accountStatus: 'active',
  }

  // ── T&C acceptance ───────────────────────────────────────────────────────
  if (data?.acceptedTermsAndConditions !== undefined) {
    payloadUpdateData.acceptedTermsAndConditions = Boolean(data.acceptedTermsAndConditions)
    if (data.acceptedTermsAndConditions === true) {
      // Record the version and timestamp of acceptance.
      // Only update if not already set to avoid overwriting a higher version.
      payloadUpdateData.tosVersion = CURRENT_TOS_VERSION
      payloadUpdateData.acceptedTermsAt = now
    }
  }

  // ── Privacy Notice acknowledgement ───────────────────────────────────────
  if (data?.acceptedPrivacyPolicy !== undefined) {
    payloadUpdateData.acceptedPrivacyPolicy = Boolean(data.acceptedPrivacyPolicy)
    if (data.acceptedPrivacyPolicy === true) {
      payloadUpdateData.privacyNoticeVersion = CURRENT_PRIVACY_VERSION
      payloadUpdateData.acknowledgedPrivacyAt = now
    }
  }

  // ── Marketing consent ────────────────────────────────────────────────────
  // Default to false if not provided — never assume opt-in.
  const marketingConsent = data?.marketingConsent === true
  payloadUpdateData.marketingConsent = marketingConsent
  payloadUpdateData.marketingConsentAt = now

  // ── Optional profile fields ──────────────────────────────────────────────
  if (income !== undefined) payloadUpdateData.income = income
  if (employmentType) payloadUpdateData.employmentType = employmentType
  if (typeof data?.email === 'string' && data.email.trim()) {
    payloadUpdateData.email = data.email.trim().toLowerCase()
  }
  if (typeof data?.phone === 'string' && data.phone.trim()) {
    payloadUpdateData.phone = data.phone.trim()
  }

  // ── Indian PAN (Permanent Account Number) ───────────────────────────────
  if (data?.pan !== undefined) {
    if (typeof data.pan === 'string' && data.pan.trim()) {
      const normalized = normalizePan(data.pan)
      if (!isValidPan(normalized)) {
        throw new AuthorizationError(
          'INVALID_PAN_FORMAT',
          'Invalid PAN format. Must be 10 alphanumeric characters (e.g. ABCDE1234F).',
          400,
        )
      }
      payloadUpdateData.pan = encryptPan(normalized)
    } else if (data.pan === null || data.pan === '') {
      payloadUpdateData.pan = null
    }
  }

  const updated = await payload.update({
    collection: 'users',
    id: user.id,
    data: payloadUpdateData,
    overrideAccess: true,
    depth: 0,
  })

  return updated
}