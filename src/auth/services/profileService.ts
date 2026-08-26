import type { Payload } from 'payload'

import type { User } from '@/payload-types'
import { findUserByEmail } from '@/auth/services/userService'
import { AuthorizationError } from '@/auth/services/otpService'

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

  const payloadUpdateData: Record<string, unknown> = {
    name,
    profileCompleted: true,
    accountStatus: 'active',
  }
  if (income !== undefined) payloadUpdateData.income = income
  if (employmentType) payloadUpdateData.employmentType = employmentType
  if (typeof data?.email === 'string' && data.email.trim()) {
    payloadUpdateData.email = data.email.trim().toLowerCase()
  }
  if (typeof data?.phone === 'string' && data.phone.trim()) {
    payloadUpdateData.phone = data.phone.trim()
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