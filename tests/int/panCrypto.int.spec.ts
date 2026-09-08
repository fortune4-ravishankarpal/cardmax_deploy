// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  encryptPan,
  decryptPan,
  derivePanLookup,
  maskPan,
  isValidPan,
  normalizePan,
  PanCryptoError,
  assertValidPanEnvelope,
  parsePanEnvelope,
  type PanEncryptedEnvelope,
} from '@/auth/services/panCrypto'

describe('PAN format validation & normalization', () => {
  it('validates correct Indian PAN format', () => {
    expect(isValidPan('ABCDE1234F')).toBe(true)
    expect(isValidPan('XYZPK9876Z')).toBe(true)
  })

  it('normalizes lowercase or un-trimmed PAN to uppercase', () => {
    expect(normalizePan('  abcde1234f  ')).toBe('ABCDE1234F')
  })

  it('rejects invalid PAN formats', () => {
    expect(isValidPan('ABCDE12345')).toBe(false) // ends in digit, expected letter
    expect(isValidPan('ABC1234F')).toBe(false) // too short (8 chars)
    expect(isValidPan('ABCDEF1234F')).toBe(false) // too long (11 chars)
    expect(isValidPan('12345ABCDE')).toBe(false) // digits first
    expect(isValidPan('')).toBe(false)
    expect(isValidPan(null)).toBe(false)
    expect(isValidPan(undefined)).toBe(false)
  })
})

describe('PAN encryption & decryption (AES-256-GCM vault)', () => {
  const samplePan = 'ABCDE1234F'

  it('encrypts successfully into an authenticated single-string envelope', () => {
    const packed = encryptPan(samplePan)
    expect(packed).toBeDefined()
    expect(typeof packed).toBe('string')
    expect(packed.startsWith('v1:')).toBe(true)

    const parts = packed.split(':')
    expect(parts.length).toBe(4) // v<keyVersion>, iv, authTag, ciphertext

    const envelope = parsePanEnvelope(packed)
    expect(envelope.ciphertext).toBeTypeOf('string')
    expect(envelope.iv).toBeTypeOf('string')
    expect(envelope.authTag).toBeTypeOf('string')
    expect(envelope.algorithm).toBe('AES-256-GCM')
    expect(envelope.keyVersion).toBe('1')
  })

  it('decrypts back to the original normalized PAN from packed string', () => {
    const packed = encryptPan('abcde1234f')
    const decrypted = decryptPan(packed)
    expect(decrypted).toBe(samplePan)
  })

  it('decrypts back to the original normalized PAN from envelope object', () => {
    const packed = encryptPan('abcde1234f')
    const envelope = parsePanEnvelope(packed)
    const decrypted = decryptPan(envelope)
    expect(decrypted).toBe(samplePan)
  })

  it('produces different ciphertexts and IVs for the same PAN (random IV per encryption)', () => {
    const a = encryptPan(samplePan)
    const b = encryptPan(samplePan)
    expect(a).not.toBe(b)
    const envA = parsePanEnvelope(a)
    const envB = parsePanEnvelope(b)
    expect(envA.iv).not.toBe(envB.iv)
    expect(envA.ciphertext).not.toBe(envB.ciphertext)
  })

  it('fails decryption when authentication tag is tampered with', () => {
    const packed = encryptPan(samplePan)
    const env = parsePanEnvelope(packed)
    const tampered: PanEncryptedEnvelope = {
      ...env,
      authTag: env.authTag.slice(0, -2) + '00',
    }
    expect(() => decryptPan(tampered)).toThrowError(PanCryptoError)
  })

  it('fails decryption when ciphertext is tampered with', () => {
    const packed = encryptPan(samplePan)
    const env = parsePanEnvelope(packed)
    const buf = Buffer.from(env.ciphertext, 'base64')
    buf[0] = buf[0] ^ 0xff // flip bits
    const tampered: PanEncryptedEnvelope = {
      ...env,
      ciphertext: buf.toString('base64'),
    }
    expect(() => decryptPan(tampered)).toThrowError(PanCryptoError)
  })

  it('fails decryption when envelope structure is invalid', () => {
    expect(() => decryptPan({} as any)).toThrowError(PanCryptoError)
    expect(() => decryptPan('invalid:envelope')).toThrowError(PanCryptoError)
    expect(() => decryptPan({ ciphertext: 'abc' } as any)).toThrowError(PanCryptoError)
  })

  it('rejects invalid PAN during encryption attempt', () => {
    expect(() => encryptPan('INVALID')).toThrowError(PanCryptoError)
  })
})

describe('PAN blind index (HMAC-SHA-256 lookup)', () => {
  it('produces identical lookup values for the same PAN regardless of case/spacing', () => {
    const lookup1 = derivePanLookup('ABCDE1234F')
    const lookup2 = derivePanLookup(' abcde1234f ')
    expect(lookup1).toBe(lookup2)
    expect(lookup1).toMatch(/^[a-f0-9]{64}$/) // SHA-256 hex string
  })

  it('produces distinct lookup values for different PANs', () => {
    const lookup1 = derivePanLookup('ABCDE1234F')
    const lookup2 = derivePanLookup('XYZPK9876Z')
    expect(lookup1).not.toBe(lookup2)
  })

  it('cannot be reversed into the PAN', () => {
    const lookup = derivePanLookup('ABCDE1234F')
    expect(lookup).not.toContain('ABCDE')
    expect(lookup).not.toContain('1234F')
  })
})

describe('PAN masking for display', () => {
  it('masks the first 6 characters and keeps last 4', () => {
    expect(maskPan('ABCDE1234F')).toBe('XXXXXX1234F')
    expect(maskPan('abcde1234f')).toBe('XXXXXX1234F')
  })

  it('handles empty input gracefully', () => {
    expect(maskPan('')).toBe('')
  })
})

describe('Payload Users schema direct write protection', () => {
  it('assertValidPanEnvelope rejects plaintext PAN strings', () => {
    expect(() => {
      assertValidPanEnvelope({ pan: 'ABCDE1234F' })
    }).toThrowError(PanCryptoError)
  })

  it('assertValidPanEnvelope rejects incomplete PAN envelope objects', () => {
    expect(() => {
      assertValidPanEnvelope({ pan: { ciphertext: 'something-only' } })
    }).toThrowError(PanCryptoError)
  })

  it('assertValidPanEnvelope allows valid encrypted envelopes', () => {
    const validEnvelope = encryptPan('ABCDE1234F')
    expect(() => {
      assertValidPanEnvelope({ pan: validEnvelope })
    }).not.toThrow()
  })

  it('assertValidPanEnvelope ignores null/undefined pan (optional for existing users)', () => {
    expect(() => {
      assertValidPanEnvelope({ pan: null })
      assertValidPanEnvelope({ pan: undefined })
      assertValidPanEnvelope({})
    }).not.toThrow()
  })
})

describe('Profile validation schemas with PAN', () => {
  it('validates and normalizes valid PAN in completeProfileSchema', async () => {
    const { completeProfileSchema } = await import('@/auth/validation/schemas')
    const res = completeProfileSchema.safeParse({
      name: 'Test User',
      pan: 'abcde1234f',
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.pan).toBe('ABCDE1234F')
    }
  })

  it('rejects invalid PAN in completeProfileSchema', async () => {
    const { completeProfileSchema } = await import('@/auth/validation/schemas')
    const res = completeProfileSchema.safeParse({
      name: 'Test User',
      pan: 'ABCDE12345',
    })
    expect(res.success).toBe(false)
  })

  it('allows optional/null PAN in completeProfileSchema', async () => {
    const { completeProfileSchema } = await import('@/auth/validation/schemas')
    const res1 = completeProfileSchema.safeParse({ name: 'Test User' })
    const res2 = completeProfileSchema.safeParse({ name: 'Test User', pan: null })
    const res3 = completeProfileSchema.safeParse({ name: 'Test User', pan: '' })
    expect(res1.success).toBe(true)
    expect(res2.success).toBe(true)
    expect(res3.success).toBe(true)
  })

  it('validates and normalizes valid PAN in updateProfileSchema', async () => {
    const { updateProfileSchema } = await import('@/auth/validation/schemas')
    const res = updateProfileSchema.safeParse({
      name: 'Test User',
      pan: 'xyzpk9876z',
    })
    expect(res.success).toBe(true)
    if (res.success) {
      expect(res.data.pan).toBe('XYZPK9876Z')
    }
  })
})

describe('Profile service encrypted PAN storage', () => {
  it('encrypts PAN before updating user record in completeUserProfile', async () => {
    const { completeUserProfile } = await import('@/auth/services/profileService')

    let updatedData: any = null
    const payloadStub = {
      update: async (args: any) => {
        updatedData = args.data
        return { id: args.id, ...args.data }
      },
      find: async () => ({ docs: [] }),
    } as any

    const mockUser: any = { id: 'user-1', name: 'Original Name' }

    await completeUserProfile(payloadStub, mockUser, {
      name: 'Updated Name',
      pan: 'ABCDE1234F',
    })

    expect(updatedData).toBeDefined()
    // Plaintext PAN must NEVER be passed to payload.update
    expect(updatedData.pan).not.toBe('ABCDE1234F')
    // Stored as single packed encrypted string in database (one column)
    expect(typeof updatedData.pan).toBe('string')
    expect(updatedData.pan.startsWith('v1:')).toBe(true)

    // Can decrypt back with decryptPan
    const decrypted = decryptPan(updatedData.pan)
    expect(decrypted).toBe('ABCDE1234F')
  })

  it('rejects invalid PAN in completeUserProfile', async () => {
    const { completeUserProfile } = await import('@/auth/services/profileService')
    const payloadStub = { update: async () => ({}) } as any
    const mockUser: any = { id: 'user-1', name: 'Original' }

    await expect(async () => {
      await completeUserProfile(payloadStub, mockUser, {
        name: 'Updated Name',
        pan: 'INVALID_PAN',
      })
    }).rejects.toThrow()
  })
})
