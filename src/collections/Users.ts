import { ValidationError, type CollectionConfig } from 'payload'

import { COOKIE_SECURE, COOKIE_SAME_SITE, SESSION_MAX_AGE_SECONDS } from '@/auth/constants'
import { EMPLOYMENT_TYPES, ACCOUNT_STATUS_OPTIONS } from '@/auth/profileOptions'
import {
  usersReadAccess,
  usersCreateAccess,
  usersUpdateAccess,
  usersDeleteAccess,
} from '@/auth/access'
import {
  sendOtpHandler,
  verifyOtpHandler,
  googleLoginHandler,
  googleCallbackHandler,
  completeProfileHandler,
  logoutHandler,
  getProfileHandler,
  updateProfileHandler,
} from '@/auth/endpoints'
import {
  gmailConnectHandler,
  gmailInitiateConsentHandler,
  gmailCallbackHandler,
  gmailStatusHandler,
  gmailDisconnectHandler,
  gmailIngestHandler,
} from '@/auth/gmail/endpoints'
import { consentEndpoints } from '../consent/endpoints'
import { assertValidPanEnvelope } from '@/auth/services/panCrypto'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Users',
  },
  access: {
    read: usersReadAccess,
    create: usersCreateAccess,
    update: usersUpdateAccess,
    delete: usersDeleteAccess,
    admin: ({ req }) => req.user?.collection === 'admin',
  },
  auth: {
    tokenExpiration: SESSION_MAX_AGE_SECONDS,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: {
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE as 'Lax' | 'Strict' | 'None',
    },
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && data.password) {
          const pwd = String(data.password)
          if (pwd.length < 8) {
            throw new ValidationError({
              errors: [{ message: 'Password must be at least 8 characters long.', path: 'password' }],
            })
          }
          if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwd)) {
            throw new ValidationError({
              errors: [
                {
                  message:
                    'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
                  path: 'password',
                },
              ],
            })
          }
        }
        if (data) {
          try {
            assertValidPanEnvelope(data as Record<string, unknown>)
          } catch (err: any) {
            throw new ValidationError({
              errors: [{ message: err.message, path: 'pan' }],
            })
          }
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, originalDoc }) => {
        if (data) {
          const first = data.firstName !== undefined ? data.firstName : originalDoc?.firstName
          const last = data.lastName !== undefined ? data.lastName : originalDoc?.lastName
          if (first || last) {
            data.name = [first, last].filter(Boolean).join(' ').trim()
          }
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ req, id }) => {
        if (!id) return

        try {
          // 1. Subscriptions children
          const subscriptions = await req.payload.find({
            collection: 'subscriptions',
            where: { user: { equals: id } },
            req,
            depth: 0,
          })
          for (const sub of subscriptions.docs) {
            await req.payload.delete({
              collection: 'subscription-events',
              where: { subscription: { equals: sub.id } },
              req,
            })
            await req.payload.delete({
              collection: 'subscription-payments',
              where: { subscription: { equals: sub.id } },
              req,
            })
          }

          // 2. Dependents
          const dependentsToCascade = ['user-goals'] as const
          for (const collection of dependentsToCascade) {
            await req.payload.delete({ collection, where: { user: { equals: id } }, req })
          }

          // 3. Main collections
          const mainCollectionsToCascade = [
            'analytics-events',
            'cards',
            'consents',
            'consent-events',
            'gmail-connections',
            'max-pro-events',
            'notifications',
            'statements',
            'subscriptions',
            'trial-eligibility',
            'user-cards',
          ] as const
          for (const collection of mainCollectionsToCascade) {
            await req.payload.delete({ collection, where: { user: { equals: id } }, req })
          }
        } catch (error) {
          req.payload.logger.error({ msg: `Failed to cascade delete for user ${id}`, error })
          throw error
        }
      },
    ],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
      validate: (value: unknown) => {
        if (!value || typeof value !== 'string') return 'Email address is required.'
        const trimmed = value.trim()
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailRegex.test(trimmed)) {
          return 'Please enter a valid email address (e.g. user@example.com).'
        }
        return true
      },
    },
    {
      name: 'name',
      type: 'text',
      required: false,
      admin: {
        readOnly: true,
        description: 'Auto-generated from First Name and Last Name',
      },
      validate: (value: unknown) => {
        if (!value) return true
        if (typeof value !== 'string') return 'Name must be text.'
        const trimmed = value.trim()
        if (!trimmed) return true
        if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
          return 'Name can only contain letters, spaces, hyphens, and apostrophes (no numbers).'
        }
        return true
      },
      hooks: {
        beforeChange: [
          ({ siblingData, originalDoc, value }) => {
            const first = siblingData?.firstName !== undefined ? siblingData.firstName : originalDoc?.firstName
            const last = siblingData?.lastName !== undefined ? siblingData.lastName : originalDoc?.lastName
            if (first || last) {
              return [first, last].filter(Boolean).join(' ').trim()
            }
            return value ?? originalDoc?.name ?? ''
          },
        ],
      },
    },
    {
      name: 'firstName',
      type: 'text',
      required: false,
      validate: (value: unknown) => {
        if (!value) return true
        if (typeof value !== 'string') return 'First name must be text.'
        const trimmed = value.trim()
        if (!trimmed) return true
        if (trimmed.length < 2) return 'First name must be at least 2 characters.'
        if (trimmed.length > 50) return 'First name cannot exceed 50 characters.'
        if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
          return 'First name can only contain letters, spaces, hyphens, and apostrophes (numbers not allowed).'
        }
        return true
      },
    },
    {
      name: 'lastName',
      type: 'text',
      required: false,
      validate: (value: unknown) => {
        if (!value) return true
        if (typeof value !== 'string') return 'Last name must be text.'
        const trimmed = value.trim()
        if (!trimmed) return true
        if (trimmed.length > 50) return 'Last name cannot exceed 50 characters.'
        if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
          return 'Last name can only contain letters, spaces, hyphens, and apostrophes (numbers not allowed).'
        }
        return true
      },
    },
    {
      name: 'dob',
      type: 'date',
      required: false,
    },
    {
      name: 'phone',
      type: 'text',
      index: true,
      admin: {
        placeholder: 'e.g. 9876543210 or +919876543210',
      },
      validate: (value: unknown) => {
        if (!value) return true
        if (typeof value !== 'string') return 'Phone number must be text.'
        const trimmed = value.trim()
        if (!trimmed) return true
        const clean = trimmed.replace(/[\s-]/g, '')
        if (!/^\+?[0-9]{10,15}$/.test(clean)) {
          return 'Please enter a valid phone number (10 to 15 digits only, letters not allowed).'
        }
        return true
      },
    },
    {
      name: 'authenticationProvider',
      type: 'select',
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'Google', value: 'google' },
      ],
      defaultValue: 'email',
      index: true,
      required: true,
      admin: { position: 'sidebar', readOnly: true },
      access: { read: () => true, update: () => false, create: () => true },
    },
    {
      name: 'authenticationProviderId',
      type: 'text',
      index: true,
      admin: { position: 'sidebar', readOnly: true },
      access: { update: () => false },
    },
    {
      name: 'profileCompleted',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'income',
      type: 'number',
      min: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'employmentType',
      type: 'select',
      options: [...EMPLOYMENT_TYPES],
      admin: { position: 'sidebar' },
    },
    {
      name: 'accountStatus',
      type: 'select',
      options: [...ACCOUNT_STATUS_OPTIONS],
      defaultValue: 'active',
      index: true,
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'acceptedTermsAndConditions',
      type: 'checkbox',
      label: 'Accept the Terms and Conditions',
      defaultValue: false,
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'acceptedPrivacyPolicy',
      type: 'checkbox',
      label: 'Accept the Privacy Policy',
      defaultValue: false,
      required: true,
      admin: { position: 'sidebar' },
    },
    // ── Legal acceptance audit fields ────────────────────────────────────────
    // These complement the legacy boolean fields above with proper versioning
    // and timestamps.  Values are set on profile completion and re-acknowledgement.
    // 'legacy' sentinel = user accepted before versioning was introduced;
    // the exact timestamp is unknown and must NOT be fabricated.
    {
      name: 'tosVersion',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Version of Terms of Service accepted. "legacy" = accepted before versioning; null = not yet accepted.',
        readOnly: true,
      },
    },
    {
      name: 'acceptedTermsAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When the Terms of Service were accepted. Null for legacy or not-yet-accepted.',
        readOnly: true,
      },
    },
    {
      name: 'privacyNoticeVersion',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Version of Privacy Notice acknowledged. "legacy" = acknowledged before versioning.',
        readOnly: true,
      },
    },
    {
      name: 'acknowledgedPrivacyAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When the Privacy Notice was acknowledged. Null for legacy or not-yet-acknowledged.',
        readOnly: true,
      },
    },
    // ── Optional processing preferences ──────────────────────────────────────
    {
      name: 'marketingConsent',
      type: 'checkbox',
      label: 'Opted in to marketing emails',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Whether the user has opted in to promotional/product-update emails. Default false. Does not affect transactional/system emails.',
      },
    },
    {
      name: 'marketingConsentAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When the marketing consent preference was last changed.',
        readOnly: true,
      },
    },
    // ── Secure Indian PAN (Permanent Account Number) ───────────────────────────
    // Encrypted string stored in a single database column (`pan`).
    // Format: `v<keyVersion>:<iv>:<authTag>:<ciphertext>` (AES-256-GCM).
    // Plaintext PAN is NEVER stored in the database.
    // Internal encrypted string is blocked from REST, GraphQL, and Admin UI.
    {
      name: 'pan',
      type: 'text',
      admin: {
        hidden: true,
      },
      access: {
        read: () => false,
        create: () => false,
        update: () => false,
      },
    },
  ],
  endpoints: [
    {
      path: '/send-otp',
      method: 'post',
      handler: sendOtpHandler,
    },
    {
      path: '/verify-otp',
      method: 'post',
      handler: verifyOtpHandler,
    },
    {
      path: '/complete-profile',
      method: 'post',
      handler: completeProfileHandler,
    },
    {
      path: '/profile',
      method: 'get',
      handler: getProfileHandler,
    },
    {
      path: '/profile',
      method: 'patch',
      handler: updateProfileHandler,
    },
    {
      path: '/logout',
      method: 'post',
      handler: logoutHandler,
    },
    {
      path: '/google/login',
      method: 'get',
      handler: googleLoginHandler,
    },
    {
      path: '/google/callback',
      method: 'get',
      handler: googleCallbackHandler,
    },
    {
      path: '/gmail/connect',
      method: 'get',
      handler: gmailConnectHandler,
    },
    {
      path: '/gmail/initiate-consent',
      method: 'post',
      handler: gmailInitiateConsentHandler,
    },
    {
      path: '/gmail/callback',
      method: 'get',
      handler: gmailCallbackHandler,
    },
    {
      path: '/gmail/status',
      method: 'get',
      handler: gmailStatusHandler,
    },
    {
      path: '/gmail/disconnect',
      method: 'post',
      handler: gmailDisconnectHandler,
    },
    {
      path: '/gmail/ingest',
      method: 'post',
      handler: gmailIngestHandler,
    },
    ...consentEndpoints,
  ],
}
