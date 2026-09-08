import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'crypto'

import { env } from '@/lib/env'

/**
 * Indian Permanent Account Number (PAN) Secure Vault
 *
 * AES-256-GCM authenticated encryption for sensitive PAN data with:
 * - 12-byte random IV/nonce per encryption operation
 * - Additional Authenticated Data (AAD) binding to application domain ('cardmax:user-pan:v1')
 * - Key derivation with dedicated domain prefix
 * - Configurable versioned keys via `PAN_ENCRYPTION_KEYS` / `PAN_ENCRYPTION_KEY`
 * - Deterministic HMAC-SHA-256 blind index for exact match without reversible searching
 * - Masking function (e.g. `XXXXXX1234F`)
 */

export const PAN_VAULT_ALGORITHM = 'aes-256-gcm'
export const PAN_VAULT_AAD = 'cardmax:user-pan:v1'
const IV_LENGTH = 12 // Recommended 96-bit nonce for GCM
const KEY_LABEL_PREFIX = 'cardmax:user-pan:key'
const LOOKUP_LABEL_PREFIX = 'cardmax:user-pan:lookup'

/** Standard Indian PAN format: 5 letters, 4 digits, 1 letter (uppercase) */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

export interface PanEncryptedEnvelope {
  ciphertext: string
  iv: string
  authTag: string
  keyVersion: string
  algorithm: 'AES-256-GCM'
  lookup?: string
}

export class PanCryptoError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.code = code
    this.status = status
    this.name = 'PanCryptoError'
  }
}

type VersionedKeyMap = Record<string, string>

const parseVersionedKeys = (): VersionedKeyMap => {
  const raw = env.PAN_ENCRYPTION_KEYS
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as VersionedKeyMap
    }
  } catch {
    throw new PanCryptoError(
      'PAN_ENCRYPTION_KEYS_INVALID',
      'PAN_ENCRYPTION_KEYS must be a JSON object mapping key versions to secret values.',
      500,
    )
  }
  throw new PanCryptoError(
    'PAN_ENCRYPTION_KEYS_INVALID',
    'PAN_ENCRYPTION_KEYS must be a JSON object mapping key versions to secret values.',
    500,
  )
}

/** Look up the managed secret for a specific key version. */
export const getSecretForVersion = (version: string): string => {
  const map = parseVersionedKeys()
  const versions = Object.keys(map)

  if (versions.length > 0) {
    if (Object.prototype.hasOwnProperty.call(map, version)) return map[version]
    throw new PanCryptoError(
      'PAN_KEY_VERSION_UNKNOWN',
      `The configured PAN encryption key version "${version}" does not exist.`,
      500,
    )
  }

  if (version !== '1') {
    throw new PanCryptoError(
      'PAN_KEY_VERSION_UNKNOWN',
      `The stored PAN key version "${version}" has no matching key.`,
      500,
    )
  }

  if (env.PAN_ENCRYPTION_KEY) {
    return env.PAN_ENCRYPTION_KEY
  }

  // Strict production requirement: do not silently use PAYLOAD_SECRET in production
  if (process.env.NODE_ENV === 'production') {
    throw new PanCryptoError(
      'PAN_KEY_MISSING',
      'PAN_ENCRYPTION_KEY or PAN_ENCRYPTION_KEYS must be configured in production.',
      500,
    )
  }

  // Development/test fallback only
  return env.PAYLOAD_SECRET
}

/** Derive a 32-byte AES-256 key for a given version from the managed secret. */
export const derivePanEncryptionKey = (version: string): Buffer => {
  const secret = getSecretForVersion(version)
  return createHash('sha256').update(`${KEY_LABEL_PREFIX}:${version}:${secret}`).digest()
}

/** Resolve the current key version used for new ciphertext. */
export const getCurrentPanKeyVersion = (): string => {
  const map = parseVersionedKeys()
  const versions = Object.keys(map)

  if (versions.length > 0) {
    if (env.PAN_ENCRYPTION_CURRENT_KEY_VERSION) {
      const requested = env.PAN_ENCRYPTION_CURRENT_KEY_VERSION
      if (!Object.prototype.hasOwnProperty.call(map, requested)) {
        throw new PanCryptoError(
          'PAN_KEY_VERSION_UNKNOWN',
          'PAN_ENCRYPTION_CURRENT_KEY_VERSION does not exist in PAN_ENCRYPTION_KEYS.',
          500,
        )
      }
      return requested
    }
    return versions.sort((a, b) => Number(b) - Number(a))[0]
  }

  return '1'
}

/** Normalize input PAN: trim whitespace and uppercase. */
export const normalizePan = (pan: unknown): string => {
  if (typeof pan !== 'string') return ''
  return pan.trim().toUpperCase()
}

/** Check if value matches Indian PAN 10-character format. */
export const isValidPan = (pan: unknown): boolean => {
  if (typeof pan !== 'string') return false
  return PAN_REGEX.test(pan)
}

/**
 * Mask a PAN for safe UI display (e.g. `XXXXXX1234F`).
 * Shows last 5 characters (e.g. 4 digits + 1 letter), masking first characters with XXXXXX.
 */
export const maskPan = (pan: string): string => {
  const normalized = normalizePan(pan)
  if (!normalized) return ''
  if (normalized.length === 10) {
    return `XXXXXX${normalized.slice(5)}`
  }
  return normalized.length > 5 ? `XXXXXX${normalized.slice(5)}` : 'XXXXXX'
}

/**
 * Validates that data being written to User record contains only valid encrypted envelopes,
 * actively rejecting any plaintext PAN strings or corrupted envelopes.
 */
export const assertValidPanEnvelope = (data: Record<string, unknown> | undefined | null): void => {
  if (!data || data.pan === undefined || data.pan === null) return

  if (typeof data.pan === 'string') {
    throw new PanCryptoError(
      'PAN_PLAINTEXT_PROHIBITED',
      'Plaintext PAN cannot be persisted directly. Use the profile service or panCrypto to encrypt before storage.',
      400,
    )
  }

  if (typeof data.pan === 'object') {
    const p = data.pan as Record<string, unknown>
    const hasAny = p.ciphertext || p.iv || p.authTag || p.keyVersion
    if (hasAny && (!p.ciphertext || !p.iv || !p.authTag || !p.keyVersion)) {
      throw new PanCryptoError(
        'PAN_ENVELOPE_INCOMPLETE',
        'Incomplete PAN encrypted envelope.',
        400,
      )
    }
  }
}

/**
 * Deterministic HMAC-SHA-256 blind index for exact-match PAN queries.
 * Derived using a dedicated secret/domain prefix separate from encryption key.
 */
export const derivePanLookup = (pan: string): string => {
  const normalized = normalizePan(pan)
  if (!isValidPan(normalized)) {
    throw new PanCryptoError(
      'INVALID_PAN_FORMAT',
      'Invalid PAN format. Must be 10 alphanumeric characters (e.g. ABCDE1234F).',
      400,
    )
  }

  const map = parseVersionedKeys()
  const versions = Object.keys(map).sort((a, b) => Number(a) - Number(b))
  let secret: string
  if (versions.length > 0) {
    secret = map[versions[0]]
  } else if (env.PAN_ENCRYPTION_KEY) {
    secret = env.PAN_ENCRYPTION_KEY
  } else if (process.env.NODE_ENV === 'production') {
    throw new PanCryptoError(
      'PAN_KEY_MISSING',
      'PAN_ENCRYPTION_KEY or PAN_ENCRYPTION_KEYS must be configured in production.',
      500,
    )
  } else {
    secret = env.PAYLOAD_SECRET
  }

  const lookupKey = createHash('sha256').update(`${LOOKUP_LABEL_PREFIX}:${secret}`).digest()
  return createHmac('sha256', lookupKey).update(normalized).digest('hex')
}

/**
 * Encrypt a plaintext PAN into an authenticated AES-256-GCM envelope.
 */
export const encryptPan = (pan: string): PanEncryptedEnvelope => {
  const normalized = normalizePan(pan)
  if (!isValidPan(normalized)) {
    throw new PanCryptoError(
      'INVALID_PAN_FORMAT',
      'Invalid PAN format. Must be 10 alphanumeric characters (e.g. ABCDE1234F).',
      400,
    )
  }

  const keyVersion = getCurrentPanKeyVersion()
  const key = derivePanEncryptionKey(keyVersion)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(PAN_VAULT_ALGORITHM, key, iv)
  cipher.setAAD(Buffer.from(PAN_VAULT_AAD, 'utf8'))

  const ciphertext = Buffer.concat([
    cipher.update(normalized, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  const lookup = derivePanLookup(normalized)

  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('hex'),
    keyVersion,
    algorithm: 'AES-256-GCM',
    lookup,
  }
}

/**
 * Decrypt an AES-256-GCM PAN envelope.
 * Throws PanCryptoError on tag failure, tampering, or invalid envelope.
 */
export const decryptPan = (envelope: PanEncryptedEnvelope): string => {
  if (
    !envelope ||
    typeof envelope.ciphertext !== 'string' ||
    typeof envelope.iv !== 'string' ||
    typeof envelope.authTag !== 'string' ||
    typeof envelope.keyVersion !== 'string'
  ) {
    throw new PanCryptoError('PAN_ENVELOPE_INVALID', 'Invalid PAN envelope structure.', 400)
  }

  try {
    const key = derivePanEncryptionKey(envelope.keyVersion)
    const decipher = createDecipheriv(
      PAN_VAULT_ALGORITHM,
      key,
      Buffer.from(envelope.iv, 'base64'),
    )
    decipher.setAAD(Buffer.from(PAN_VAULT_AAD, 'utf8'))
    decipher.setAuthTag(Buffer.from(envelope.authTag, 'hex'))

    const decrypted = Buffer.concat([
      decipher.update(envelope.ciphertext, 'base64'),
      decipher.final(),
    ])

    const pan = decrypted.toString('utf8')
    if (!isValidPan(pan)) {
      throw new Error('Decrypted value does not match PAN format')
    }
    return pan
  } catch (cause) {
    if (cause instanceof PanCryptoError) throw cause
    throw new PanCryptoError(
      'PAN_DECRYPT_FAILED',
      'Stored PAN data could not be decrypted. The record may be corrupted or encrypted with an unavailable key version.',
      500,
    )
  }
}
