import { CardError } from './errors'

/**
 * Validation for PCI-sensitive card data..
 *
 * - PAN: 12–19 digits and passes Luhn checksum. Strips spaces/dashes..
 *
 * - Prohibited card authentication data (CVV/CVC/CID, PIN/PIN block, full
 *   track data, EMV/chip data, and equivalents) is actively rejected before it
 *   could ever be persisted — no workaround encrypts and stores these values..
 */

/** Strip formatting (spaces, dashes) from a PAN.. */
export const normalizePan = (pan: unknown): string =>
  typeof pan === 'string' ? pan.replace(/[\s-]/g, '') : ''

/** Luhn checksum validation for card numbers.. */
export const isValidLuhn = (digits: string): boolean => {
  if (!/^\d{12,19}$/.test(digits)) return false
  let sum = 0
  let double = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48
    if (double) {
      d *=2
      if (d >= 10) d -=9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'unknown'

/** Detect a card brand from PAN prefixes — used only for display (no sensitive value). */
export const detectCardBrand = (digits: string): CardBrand => {
  if (/^4/.test(digits)) return 'visa'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/.test(digits)) return 'mastercard'
  if (/^(60|65|81|82|508|50|36|38|39|63)/.test(digits)) return 'rupay'
  return 'unknown'
}

/**
 * Keys (and key fragments) that must never be persisted — PCI prohibited
 * card authentication data. Word-boundary aware so e.g. `pincode` (postal code)
 * is not falsely rejected while `pin`, `pinblock`, `track2` etc are..
 */
const BANNED_KEY_PATTERNS: RegExp[] = [
  /(^|[\s_\-.])cvv2?($|[\s_\-.])/i,
  /(^|[\s_\-.])cvc2?($|[\s_\-.])/i,
  /(^|[\s_\-.])cid($|[\s_\-.])/i,
  /(^|[\s_\-.])securitycode($|[\s_\-.])/i,
  /(^|[\s_\-.])security_code($|[\s_\-.])/i,
  /(^|[\s_\-.])pinblock($|[\s_\-.])/i,
  /(^|[\s_\-.])pin($|[\s_\-.])/i,
  /(^|[\s_\-.])track\d*(data)?($|[\s_\-.])/i,
  // "track2EquivalentData" is the real EMV tag 57 name - any "track<digit>"
  // fragment must be treated as track data (track1/track2/track3).
  /track\d/i,
  /(^|[\s_\-.])magstripe($|[\s_\-.])/i,
  /(^|[\s_\-.])magneticstripe($|[\s_\-.])/i,
  /(^|[\s_\-.])magnetic_stripe($|[\s_\-.])/i,
  /(^|[\s_\-.])emv($|[\s_\-.])/i,
	  /(^|[\s_\-.])chipdata($|[\s_\-.])/i,
	  /(^|[\s_\-.])chip_data($|[\s_\-.])/i,
	  /(^|[\s_\-.])cavv($|[\s_\-.])/i,
	  /(^|[\s_\-.])arpc($|[\s_\-.])/i,
	  /(^|[\s_\-.])icvv($|[\s_\-.])/i,
  // Common CVV/CVC aliases written as compound names.
  /(^|[\s_\-.])cardsecuritycode($|[\s_\-.])/i,
  /(^|[\s_\-.])cardverification(code|value)($|[\s_\-.])/i,
]

/** True if a field name refers to prohibited card authentication data. */
export const isProhibitedCardDataKey = (key: string): boolean =>
  BANNED_KEY_PATTERNS.some((re) => re.test(key))

/**
 * Recursively verify that an incoming payload contains no prohibited card
 * authentication data field names.. Throws `CardError` (400) if found...
 */
export const assertNoProhibitedCardData = (data: Record<string, unknown> | undefined): void => {
  if (!data) return
  const scan = (obj: Record<string, unknown>, path: string): void => {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key
      if (isProhibitedCardDataKey(key)) {
        throw new CardError(
          'CARD_PROHIBITED_DATA',
          `Refusing to store prohibited card authentication data (${fullPath}). CVV/CVC/CID, PIN/PIN block, full track data and EMV/chip data must never be persisted.`,
          400,
        )
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        scan(value as Record<string, unknown>, fullPath)
      }
    }
  }
  scan(data, '')
}

/** Normalized card input accepted by the secure card APIs. */
export interface CardInput {
  cardNumber?: unknown
  pan?: unknown
  cardholderName?: unknown
  expiryMonth?: unknown
  expiryYear?: unknown
  nickname?: unknown
}

export interface NormalizedCardInput {
  pan?: string
  last4?: string
  brand?: CardBrand
  cardholderName?: string
  expiryMonth?: number
  expiryYear?: number
  nickname?: string
}

/** Fields the secure card endpoints accept. Unknown keys are rejected (400). */
export const ALLOWED_CARD_INPUT_KEYS = new Set<string>([
  'cardNumber',
  'pan',
  'cardholderName',
  'expiryMonth',
  'expiryYear',
  'nickname',
])

/**
 * Validate and normalize card input before any plaintext can reach the database..
 *
 * @param requirePan when true (create),the PAN, cardholder name and expiry are mandatory..
 */
export const validateAndNormalizeCardInput = (
  data: Record<string, unknown>,
  opts: { requirePan?: boolean; existingBrand?: CardBrand | null } = {},
): NormalizedCardInput => {
  const unknownKey = Object.keys(data).find((key) => !ALLOWED_CARD_INPUT_KEYS.has(key))
  if (unknownKey) {
    throw new CardError('CARD_UNKNOWN_FIELD', `Unknown field "${unknownKey}" is not accepted by the secure card API.`, 400)
  }

	 const out: NormalizedCardInput = {}
  const rawPan = typeof data.pan === 'string' ? data.pan : (typeof data.cardNumber === 'string' ? data.cardNumber : undefined)

  if (rawPan !== undefined || opts.requirePan) {
    const digits = normalizePan(rawPan ?? '')
    if (!isValidLuhn(digits)) {
      throw new CardError('CARD_PAN_INVALID', 'The card number is invalid. It must be 12-19 digits and pass the Luhn checksum.', 400,
      )
    }
    out.pan = digits
    out.last4 = digits.slice(-4)
    out.brand = detectCardBrand(digits)
  } else {
    out.brand = opts.existingBrand && opts.existingBrand !== 'unknown' ? opts.existingBrand : undefined
  }

	 if (data.cardholderName !== undefined || opts.requirePan) {
    const name = typeof data.cardholderName === 'string' ? data.cardholderName.trim() : ''
    if (!name) {
      throw new CardError('CARD_HOLDER_NAME_REQUIRED', 'The cardholder name is required.', 400)
    }
    if (name.length > 100) {
      throw new CardError('CARD_HOLDER_NAME_INVALID', 'The cardholder name must be 100 characters or fewer.', 400)
    }
    out.cardholderName = name
  }

	 // Expiry month/year are stored as plaintext non-PAN metadata (validated here)
  // and as Payload field validators on the collection itself..
  if (data.expiryMonth !== undefined || opts.requirePan) {
    const month = Number(data.expiryMonth)
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new CardError('CARD_EXPIRY_INVALID', 'Expiry month must be an integer between 1 and 12.', 400)
    }
    out.expiryMonth = month
  }

	 if (data.expiryYear !== undefined || opts.requirePan) {
    const year = Number(data.expiryYear)
    if (!Number.isInteger(year) || year < 2000 || year > 2199) {
      throw new CardError('CARD_EXPIRY_INVALID', 'Expiry year must be a 4-digit year between 2000 and 2199.', 400)
    }
    out.expiryYear = year
  }

	 // Refuse clearly expired cards (a card needs a valid expiry; users can update later..
	 if ((out.expiryMonth !== undefined || out.expiryYear !== undefined) && opts.requirePan) {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    if (
      (out.expiryYear ?? 0) < currentYear ||
      ((out.expiryYear ?? 0) === currentYear && (out.expiryMonth ?? 0) < currentMonth)
    ) {
      throw new CardError('CARD_EXPIRED', 'This card has expired. Please enter avalid expiry date.', 400)
    }
  }

	 if (data.nickname !== undefined) {
    const nickname = typeof data.nickname === 'string' ? data.nickname.trim().slice(0, 60) : undefined
    out.nickname = nickname || undefined
  }

	 return out
}