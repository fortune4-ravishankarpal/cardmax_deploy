// @vitest-environment node
import { describe, expect, it } from 'vitest'

import {
  decryptCardEnvelope,
  derivePanLookup,
  encryptCardEnvelope,
  getCurrentCardKeyVersion,
  maskPan,
  maskPanFromLast4,
  rotateCardEnvelope,
} from '@/cards/cardCrypto'
import { CardError } from '@/cards/errors'
import {
  assertNoProhibitedCardData,
  detectCardBrand,
  isProhibitedCardDataKey,
  isValidLuhn,
  normalizePan,
  validateAndNormalizeCardInput,
} from '@/cards/validation'

const TEST_PAN = '4111111111111111' // Visa test PAN (valid Luhn)
const TEST_HOLDER = 'JANE DOE'

/**
 * Assert that `fn` throws a `CardError` carrying the given machine-readable
 * code. Error messages are intentionally human-readable (and must never
 * contain sensitive values), so tests must match on `code`, never on message.
 */
const expectCardErrorCode = (fn: () => unknown, code: string): void => {
  let thrown: unknown
  let didThrow = false
  try {
    fn()
  } catch (error) {
    didThrow = true
    thrown = error
  }
  if (!didThrow) {
    expect.unreachable(`expected function to throw a CardError with code "${code}"`)
  }
  expect(thrown).toBeInstanceOf(CardError)
  expect((thrown as CardError).code).toBe(code)
}

describe('card vault envelope encryption (AES-256-GCM)', () => {
  it('round-trips an encrypted card envelope', () => {
    const cipher = encryptCardEnvelope({ pan: TEST_PAN, cardholderName: TEST_HOLDER })
    expect(decryptCardEnvelope(cipher)).toEqual({ pan: TEST_PAN, cardholderName: TEST_HOLDER })
  })

  it('never stores the PAN as plaintext in the ciphertext output', () => {
    const cipher = encryptCardEnvelope({ pan: TEST_PAN, cardholderName: TEST_HOLDER })
    expect(cipher.encrypted).not.toContain(TEST_PAN)
    expect(cipher.encrypted).not.toContain('4111')
    expect(cipher.iv).not.toContain(TEST_PAN)
    expect(cipher.tag).not.toContain(TEST_PAN)
  })

  it('produces unique ciphertext for identical plaintext (random IV)', () => {
    const a = encryptCardEnvelope({ pan: TEST_PAN, cardholderName: TEST_HOLDER })
    const b = encryptCardEnvelope({ pan: TEST_PAN, cardholderName: TEST_HOLDER })
    expect(a.iv).not.toBe(b.iv)
    expect(a.encrypted).not.toBe(b.encrypted)
  })

  it('records the algorithm and the current managed key version', () => {
    const cipher = encryptCardEnvelope({ pan: TEST_PAN, cardholderName: TEST_HOLDER })
    expect(cipher.algorithm).toBe('AES-256-GCM')
    expect(cipher.keyVersion).toBe(getCurrentCardKeyVersion())
  })

  it('rejects tampered ciphertext (authenticated encryption)', () => {
    const cipher = encryptCardEnvelope({ pan: TEST_PAN, cardholderName: TEST_HOLDER })
    const tampered = { ...cipher, tag: `${cipher.tag.slice(0, -2)}00` }
    expectCardErrorCode(() => decryptCardEnvelope(tampered), 'CARD_DECRYPT_FAILED')
  })

  it('rejects an unknown key version instead of silently failing', () => {
    const { keyVersion: _removed, ...rest } = encryptCardEnvelope({
      pan: TEST_PAN,
      cardholderName: TEST_HOLDER,
    })
    expectCardErrorCode(
      () => decryptCardEnvelope({ ...rest, keyVersion: '9999' }),
      'CARD_KEY_VERSION_UNKNOWN',
    )
  })

  it('rotates an envelope to the current key version without data loss', () => {
    const first = encryptCardEnvelope({ pan: TEST_PAN, cardholderName: TEST_HOLDER })
    const rotated = rotateCardEnvelope(first)
    expect(decryptCardEnvelope(rotated)).toEqual({ pan: TEST_PAN, cardholderName: TEST_HOLDER })
    expect(rotated.encrypted).not.toBe(first.encrypted)
  })
})

describe('PAN masking', () => {
  it('masks a full PAN in the standard display format', () => {
    expect(maskPan(TEST_PAN)).toBe('•••• •••• •••• 1111')
  })

  it('masks from the stored last-4 digits', () => {
    expect(maskPanFromLast4('4242')).toBe('•••• •••• •••• 4242')
  })

  it('handles missing last-4 safely', () => {
    expect(maskPanFromLast4(null)).toBe('')
    expect(maskPanFromLast4(undefined)).toBe('')
  })
})

describe('HMAC PAN lookup index', () => {
  it('is deterministic for the same PAN regardless of formatting', () => {
    expect(derivePanLookup(TEST_PAN)).toBe(derivePanLookup('4111 1111 1111 1111'))
  })

  it('differs for different PANs', () => {
    expect(derivePanLookup(TEST_PAN)).not.toBe(derivePanLookup('4242424242424242'))
  })

  it('is a 64-char hex digest that never contains PAN digits', () => {
    const lookup = derivePanLookup(TEST_PAN)
    expect(lookup).toMatch(/^[0-9a-f]{64}$/)
    expect(lookup).not.toContain('4111')
    expect(lookup).not.toContain('1111')
  })
})

describe('card validation', () => {
  it('validates Luhn checksums', () => {
    expect(isValidLuhn(TEST_PAN)).toBe(true)
    expect(isValidLuhn('4242424242424242')).toBe(true)
    expect(isValidLuhn('4111111111111112')).toBe(false)
    expect(isValidLuhn('1234')).toBe(false)
  })

  it('normalizes PAN formatting (spaces and dashes)', () => {
    expect(normalizePan('4111 1111 1111 1111')).toBe(TEST_PAN)
    expect(normalizePan('4111-1111-1111-1111')).toBe(TEST_PAN)
  })

  it('detects card brands from PAN prefixes', () => {
    expect(detectCardBrand('4111111111111111')).toBe('visa')
    expect(detectCardBrand('5555555555554444')).toBe('mastercard')
    expect(detectCardBrand('378282246310005')).toBe('amex')
    expect(detectCardBrand('6521550000000004')).toBe('rupay')
  })

  it('rejects invalid PANs on create', () => {
    expectCardErrorCode(
      () =>
        validateAndNormalizeCardInput(
          { pan: '4111111111111112', cardholderName: 'A', expiryMonth: 12, expiryYear: 2030 },
          { requirePan: true },
        ),
      'CARD_PAN_INVALID',
    )
  })

  it('rejects expired cards on create', () => {
    expectCardErrorCode(
      () =>
        validateAndNormalizeCardInput(
          { pan: TEST_PAN, cardholderName: 'A', expiryMonth: 1, expiryYear: 2001 },
          { requirePan: true },
        ),
      'CARD_EXPIRED',
    )
  })

  it('rejects unknown input fields', () => {
    expectCardErrorCode(
      () => validateAndNormalizeCardInput({ pan: TEST_PAN, securityCode: '123' }),
      'CARD_UNKNOWN_FIELD',
    )
  })

  it('normalizes a valid create payload', () => {
    const out = validateAndNormalizeCardInput(
      {
        pan: '4111 1111 1111 1111',
        cardholderName: ' Jane Doe ',
        expiryMonth: 12,
        expiryYear: 2035,
      },
      { requirePan: true },
    )
    expect(out.pan).toBe(TEST_PAN)
    expect(out.last4).toBe('1111')
    expect(out.cardholderName).toBe('Jane Doe')
    expect(out.brand).toBe('visa')
  })

  it('rejects a create payload missing expiry', () => {
    expectCardErrorCode(
      () => validateAndNormalizeCardInput({ pan: TEST_PAN, cardholderName: 'A' }, { requirePan: true }),
      'CARD_EXPIRY_INVALID',
    )
  })
})

describe('prohibited card authentication data', () => {
  it('recognizes CVV/CVC/CID, PIN, track and EMV field names', () => {
    for (const key of [
      'cvv',
      'cvv2',
      'CVC',
      'cid',
      'securityCode',
      'cardSecurityCode',
      'cardVerificationValue',
      'pin',
      'pinBlock',
      'track1',
      'track2',
      'trackData',
      // EMV tag 57 - the real-world name for track 2 equivalent data.
      'track2EquivalentData',
      'magstripe',
      'emv',
      'chipData',
      'cavv',
    ]) {
      expect(isProhibitedCardDataKey(key), key).toBe(true)
    }
  })

  it('does not false-positive on unrelated field names', () => {
    expect(isProhibitedCardDataKey('pincode')).toBe(false)
    expect(isProhibitedCardDataKey('pinNumberForTravel')).toBe(false)
    expect(isProhibitedCardDataKey('cardholderName')).toBe(false)
    expect(isProhibitedCardDataKey('expiryMonth')).toBe(false)
  })

  it('refuses to persist prohibited data, including nested payloads', () => {
    expectCardErrorCode(
      () => assertNoProhibitedCardData({ cardholderName: 'A', nested: { cvv: '123' } }),
      'CARD_PROHIBITED_DATA',
    )
    expectCardErrorCode(
      () => assertNoProhibitedCardData({ track2EquivalentData: 'x' }),
      'CARD_PROHIBITED_DATA',
    )
  })

  it('accepts payloads containing only permitted card data', () => {
    expect(() =>
      assertNoProhibitedCardData({
        pan: TEST_PAN,
        cardholderName: 'A',
        expiryMonth: 1,
        expiryYear: 2030,
      }),
    ).not.toThrow()
  })
})


