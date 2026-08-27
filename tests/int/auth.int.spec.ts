// @vitest-environment node
import { describe, expect, it, beforeEach } from 'vitest'

import { detectChannel, normalizePhone, maskIdentifier, syntheticEmailForPhone } from '@/auth/identifiers'
import { generateOtpCode, otpHash, safeEqual } from '@/auth/code'
import { checkRateLimit, clearRateLimit } from '@/auth/rateLimit'
import { requestOtp, verifyOtp } from '@/auth/services/otpService'

let otpStore: any[]

const payloadStub = {
  sendEmail: async () => undefined,
    find: async (args: any) => {
    const { where } = args
    let docs = otpStore.filter((d) => !d.deletedAt)
    if (where && where.and) {
      for (const cond of where.and) {
        const key = Object.keys(cond)[0]
        const op = Object.keys(cond[key])[0]
        const val = cond[key][op]
        if (op === 'equals') {
          docs = docs.filter((d) => d[key] === val)
        } else if (op === 'greater_than') {
          docs = docs.filter((d) => d[key] > val)
        }
      }
    }
    return { docs: docs.slice(0, args.limit || 1) }
  },
  create: async (args: any) => {
    const doc = { id: Date.now().toString(), ...args.data }
    otpStore.push(doc)
    return doc
  },
  update: async (args: any) => {
    const idx = otpStore.findIndex((d) => String(d.id) === String(args.id))
    if (idx >= 0) {
      otpStore[idx] = { ...otpStore[idx], ...args.data }
      return otpStore[idx]
    }
    return null
  },
  delete: async (args: any) => {
    const idx = otpStore.findIndex((d) => String(d.id) === String(args.id))
    if (idx >= 0) {
      otpStore[idx].deletedAt = Date.now()
    }
    return { id: args.id }
  },
} as any

describe('auth identifiers', () => {
  it('detects email channels', () => {
    expect(detectChannel('jane@example.com')).toBe('email')
  })

  it('detects phone channels', () => {
    expect(detectChannel('+1 555 0100 999')).toBe('phone')
  })

  it('normalizes phone numbers', () => {
    expect(normalizePhone('+1 (555) 010-0999')).toBe('+15550100999')
  })

  it('masks emails and phones', () => {
    expect(maskIdentifier('email', 'jane@example.com')).toContain('***')
    expect(maskIdentifier('phone', '+15550100999')).toContain('****')
  })

  it('builds a synthetic email for phone users', () => {
    expect(syntheticEmailForPhone('+15550100999')).toBe('user+15550100999@cardmax.local')
  })
})

describe('auth code helpers', () => {
  it('generates numeric OTP codes of the requested length', () => {
    const code = generateOtpCode(6)
    expect(code).toMatch(/^\d{6}$/)
  })

  it('hashes and verifies codes safely', () => {
    const hash = otpHash('123456', 'salty')
    expect(safeEqual(hash, otpHash('123456', 'salty'))).toBe(true)
    expect(safeEqual(hash, otpHash('654321', 'salty'))).toBe(false)
    expect(safeEqual(hash, 'deadbeef')).toBe(false)
  })
})

describe('rate limiter', () => {
  it('rejects requests beyond the window limit', () => {
    const key = `rate-${Date.now()}`
    clearRateLimit(key)
    expect(checkRateLimit(key, 2, 1000).allowed).toBe(true)
    expect(checkRateLimit(key, 2, 1000).allowed).toBe(true)
    const blocked = checkRateLimit(key, 2, 1000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterMs).toBeGreaterThan(0)
  })
})

describe('otp service', () => {
  beforeEach(() => {
    otpStore = []
  })

  it('requests a code and returns masked destination', async () => {
    clearRateLimit(`otp-send:user+otp${Date.now()}@cardmax.local`)
    const result = await requestOtp(payloadStub, 'otp-request@example.com')
    expect(result.channel).toBe('email')
    expect(result.maskedIdentifier).toContain('***')
    expect(result.resendInSeconds).toBeGreaterThan(0)
  })

  it('enforces a resend cooldown', async () => {
    const identifier = `cooldown+${Date.now()}@example.com`
    await requestOtp(payloadStub, identifier)
    await expect(requestOtp(payloadStub, identifier)).rejects.toMatchObject({ code: 'RESEND_COOLDOWN' })
  })

  it('rejects the wrong code with the incorrect attempt error', async () => {
    const identifier = `wrongcode+${Date.now()}@example.com`
    await requestOtp(payloadStub, identifier)
    await expect(verifyOtp(payloadStub, identifier, '000000')).rejects.toMatchObject({ code: 'INVALID_OTP' })
  })

  it('locks after the maximum number of wrong attempts', async () => {
    const identifier = `attempts+${Date.now()}@example.com`
    await requestOtp(payloadStub, identifier)
    for (let i = 0; i < 5; i += 1) {
      await verifyOtp(payloadStub, identifier, '000000').catch(() => undefined)
    }
    await expect(verifyOtp(payloadStub, identifier, '000000')).rejects.toMatchObject({ code: 'TOO_MANY_ATTEMPTS' })
  })
})