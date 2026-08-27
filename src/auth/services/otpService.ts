import type { Payload } from 'payload'

import type { OtpResult } from '@/auth/types'
import {
  OTP_CODE_LENGTH,
  OTP_EXPIRY_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_SEND_MAX_PER_WINDOW,
  OTP_SEND_WINDOW_MS,
} from '@/auth/constants'
import { generateOtpCode, otpHash, randomHex, safeEqual } from '@/auth/code'
import { detectChannel, maskIdentifier, normalizePhone } from '@/auth/identifiers'
import { checkRateLimit } from '@/auth/rateLimit'
import { sendOtpCode } from '@/auth/providers/otpProvider'

class AuthorizationError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}



const normalizeIdentifier = (identifier: string): { key: string; channel: 'email' | 'phone' } => {
  const channel = detectChannel(identifier)
  const key = channel === 'email' ? identifier.toLowerCase() : normalizePhone(identifier)
  return { key, channel }
}

const getOtpRecord = async (payload: Payload, key: string): Promise<any> => {
  const result = await payload.find({
    collection: 'otp',
    where: {
      and: [
        { identifier: { equals: key } },
        { expiresAt: { greater_than: Date.now() } },
        { deletedAt: { exists: false } }
      ],
    },
    limit: 1,
  })
  return result.docs[0]
}

const deleteOtpRecord = async (payload: Payload, id: string): Promise<void> => {
  // await payload.delete({ collection: 'otp', id })
  await payload.update({
    collection: 'otp',
    id,
    data: { deletedAt: new Date().toISOString() },
  })
}

const updateOtpAttempts = async (payload: Payload, id: string, attempts: number): Promise<void> => {
  await payload.update({
    collection: 'otp',
    id,
    data: { attempts },
  })
}

const createOtpRecord = async (payload: Payload, record: any): Promise<any> => {
  return await payload.create({
    collection: 'otp',
    data: record,
  })
}

export const requestOtp = async (
  payload: Payload,
  identifier: string,
): Promise<OtpResult> => {
  const { key, channel } = normalizeIdentifier(identifier)

  const rateLimit = checkRateLimit(`otp-send:${key}`, OTP_SEND_MAX_PER_WINDOW, OTP_SEND_WINDOW_MS)
  if (!rateLimit.allowed) {
    throw new AuthorizationError('TOO_MANY_REQUESTS', 'Please try again later.', 429)
  }

  const now = Date.now()
  const existing = await getOtpRecord(payload, key)
  if (existing && now < existing.resendAt) {
    throw new AuthorizationError(
      'RESEND_COOLDOWN',
      `Please wait before requesting another code.`,
      429,
    )
  }

  const code = generateOtpCode(OTP_CODE_LENGTH)
  const salt = randomHex(8)
  const record: any = {
    identifier: key,
    channel,
    codeHash: otpHash(code, salt),
    salt,
    expiresAt: now + OTP_EXPIRY_MS,
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
    lastSentAt: now,
    resendAt: now + OTP_RESEND_COOLDOWN_MS,
  }
  await createOtpRecord(payload, record)

  await sendOtpCode(payload, { channel, destination: identifier, code })

  return {
    channel,
    maskedIdentifier: maskIdentifier(channel, identifier),
    expiresInSeconds: Math.round(OTP_EXPIRY_MS / 1000),
    resendInSeconds: Math.round(OTP_RESEND_COOLDOWN_MS / 1000),
  }
}

export const verifyOtp = async (
  payload: Payload,
  identifier: string,
  code: string,
): Promise<{ channel: 'email' | 'phone'; identifier: string }> => {
  const { key, channel } = normalizeIdentifier(identifier)
  const record = await getOtpRecord(payload, key)
  if (!record) {
    throw new AuthorizationError('INVALID_OTP', 'The code you entered is incorrect.', 400)
  }

  const now = Date.now()
  if (now > record.expiresAt) {
    await deleteOtpRecord(payload, record.id)
    throw new AuthorizationError('OTP_EXPIRED', 'This code has expired.', 400)
  }

  if (record.attempts >= record.maxAttempts) {
    await deleteOtpRecord(payload, record.id)
    throw new AuthorizationError('TOO_MANY_ATTEMPTS', 'Too many incorrect attempts.', 429)
  }

  const candidateMatch = otpHash(code, record.salt)
  if (!safeEqual(record.codeHash, candidateMatch)) {
    await updateOtpAttempts(payload, record.id, record.attempts + 1)
    throw new AuthorizationError('INVALID_OTP', 'The code you entered is incorrect.', 400)
  }

  await deleteOtpRecord(payload, record.id)
  return { channel, identifier: key }
}

export const consumePendingOtp = async (payload: Payload, identifier: string): Promise<void> => {
  const { key } = normalizeIdentifier(identifier)
  const record = await getOtpRecord(payload, key)
  if (record) {
    await deleteOtpRecord(payload, record.id)
  }
}

export { AuthorizationError, AuthorizationError as OtpError }