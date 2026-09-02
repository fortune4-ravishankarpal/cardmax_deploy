import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'crypto'

import { env } from '@/lib/env'

import { CardError } from './errors'

/**
 * Secure card vault — server-only AES-256-GCM encryption for PCI-sensitive
 * card fields (PAN, cardholder name).
 *
 * Security properties:
 * - PAN is never stored as plaintext — only authenticated AES-256-GCM ciphertext.
 *
 * - Keys are derived from managed secrets in the environment (`CARD_ENCRYPTION_KEYS`
 *   / `CARD_ENCRYPTION_KEY`, falling back to `PAYLOAD_SECRET` in development).
 *   Keys are never stored in the database, source control, or logs, and never
 *   shipped to the frontend.
 * - Key versioning is supported so ciphertext can be rotated safely.

 * - A separate deterministic HMAC-SHA-256 lookup value supports exact-match PAN
 *   lookups without ever using reversible encryption as a search index.


 * The envelope is bound to the application context via AAD so ciphertext cannot be
 * replayed across different environments/keys..
 */

export const CARD_VAULT_ALGORITHM = 'aes-256-gcm'
export const CARD_VAULT_AAD = 'cardmax:card-vault:v1'
const IV_LENGTH = 12 // recommended nonce size for GCM
const KEY_LABEL_PREFIX = 'cardmax:card-vault:key'
const LOOKUP_LABEL_PREFIX = 'cardmax:card-vault:pan-lookup'

/** Plaintext shape stored inside the encrypted envelope. */
export interface CardEnvelopePayload {
  pan: string
  cardholderName: string
}

/** Ciphertext + metadata persisted in the database for one card record. */
export interface CardEnvelopeCipher {
  encrypted: string // base64 ciphertext
  iv: string // base64 initialization vector
  tag: string // hex authentication tag
  keyVersion: string // which key version produced this ciphertext
  algorithm: string // e.g. "AES-256-GCM"
}

type VersionedKeyMap = Record<string, string>

const parseVersionedKeys = (): VersionedKeyMap => {
  const raw = env.CARD_ENCRYPTION_KEYS
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as VersionedKeyMap
    }
  } catch {
    throw new CardError(
      'CARD_ENCRYPTION_KEYS_INVALID',
      'CARD_ENCRYPTION_KEYS must be a JSON object mapping key versions to secret values.',
      500,
    )
  }
  throw new CardError(
    'CARD_ENCRYPTION_KEYS_INVALID',
    'CARD_ENCRYPTION_KEYS must be a JSON object mapping key versions to secret values.',
    500,
  )
}

/** Look up the managed secret for a specific key version. */
const getSecretForVersion = (version: string): string => {
  const map = parseVersionedKeys()
  const versions = Object.keys(map)

  if (versions.length > 0) {
    if (Object.prototype.hasOwnProperty.call(map, version)) return map[version]
    throw new CardError(
      'CARD_KEY_VERSION_UNKNOWN',
      'The configured card encryption key version does not exist.',
      500,
    )
  }

  if (version !== '1') {
    throw new CardError(
      'CARD_KEY_VERSION_UNKNOWN',
      'The stored card encryption key version has no matching key. Re-run key rotation or configure CARD_ENCRYPTION_KEYS.',
      500,
    )
  }

  // Development fallback only — production must set a dedicated key..
  return env.CARD_ENCRYPTION_KEY || env.PAYLOAD_SECRET
}

/** Derive a 32-byte AES-256 key for a given version from the managed secret. */
export const deriveCardEncryptionKey = (version: string): Buffer => {
  const secret = getSecretForVersion(version)
  return createHash('sha256').update(`${KEY_LABEL_PREFIX}:${version}:${secret}`).digest()
}

/** Resolve the current key version used for new ciphertext. */
export const getCurrentCardKeyVersion = (): string => {
  const map = parseVersionedKeys()
  const versions = Object.keys(map)

  if (versions.length > 0) {
    if (env.CARD_ENCRYPTION_CURRENT_KEY_VERSION) {
      const requested = env.CARD_ENCRYPTION_CURRENT_KEY_VERSION
      if (!Object.prototype.hasOwnProperty.call(map, requested)) {
        throw new CardError(
          'CARD_KEY_VERSION_UNKNOWN',
          'CARD_ENCRYPTION_CURRENT_KEY_VERSION does not exist in CARD_ENCRYPTION_KEYS.',
          500,
        )
      }
      return requested
    }
    // Highest numeric version wins by default..
    return versions.sort((a,b) => Number(b) - Number(a))[0]
  }

  return '1'
}

/** Encrypt card data into an authenticated AES-256-GCM envelope. */
export const encryptCardEnvelope = (payload: CardEnvelopePayload): CardEnvelopeCipher => {
  const keyVersion = getCurrentCardKeyVersion()
  const key = deriveCardEncryptionKey(keyVersion)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(CARD_VAULT_ALGORITHM, key, iv)
  cipher.setAAD(Buffer.from(CARD_VAULT_AAD, 'utf8'))
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify({ pan: payload.pan, cardholderName: payload.cardholderName }), 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('hex'),
    keyVersion,
    algorithm: 'AES-256-GCM',
  }
}

/**
 * Decrypt an envelope. Throws if the authentication tag fails, the key version
 * is unknown, or the payload shape is invalid (tamper detection).
 */
export const decryptCardEnvelope = (cipher: CardEnvelopeCipher): CardEnvelopePayload => {
  try {
    const key = deriveCardEncryptionKey(cipher.keyVersion)
    const decipher = createDecipheriv(CARD_VAULT_ALGORITHM, key, Buffer.from(cipher.iv, 'base64'))
    decipher.setAAD(Buffer.from(CARD_VAULT_AAD, 'utf8'))
    decipher.setAuthTag(Buffer.from(cipher.tag, 'hex'))
    const decrypted = Buffer.concat([
      decipher.update(cipher.encrypted, 'base64'),
      decipher.final(),
    ])
    const payload = JSON.parse(decrypted.toString('utf8')) as CardEnvelopePayload
    if (!payload || typeof payload.pan !== 'string' || typeof payload.cardholderName !== 'string') {
      throw new Error('invalid card envelope payload')
    }
    return { pan: payload.pan, cardholderName: payload.cardholderName }
  } catch (cause) {
    // A precise CardError (e.g. CARD_KEY_VERSION_UNKNOWN) must not be masked as
    // a generic decrypt failure - rethrow it unchanged (messages stay PAN-free).
    if (cause instanceof CardError) throw cause
    throw new CardError(
      'CARD_DECRYPT_FAILED',
      'Stored card data could not be decrypted. The record may be corrupted or encrypted with an unavailable key version.',
      500,
      { cause },
    )
  }
}

/** Re-encrypt an envelope with the current key version (used for key rotation). */
export const rotateCardEnvelope = (cipher: CardEnvelopeCipher): CardEnvelopeCipher => {
  const payload = decryptCardEnvelope(cipher)
  return encryptCardEnvelope(payload)
}

/**
 * Deterministic HMAC-SHA-256 lookup value for exact-match PAN lookups..
 *
 * - Stored separately from the encrypted PAN..
 * - Used only for exact equality matching — never for fuzzy search or display..
 * - Not reversible — the lookup index cannot recover the PAN..
 * - Stable across envelope key rotations (the lookup key derives from the first-managed secret..
 */
export const derivePanLookup = (pan: string): string => {
  const digits = pan.replace(/\D/g, '')
  const map = parseVersionedKeys()
  const versions = Object.keys(map).sort((a,b) => Number(a) - Number(b))
  const secret = versions.length > 0
    ? map[versions[0]]
    : env.CARD_ENCRYPTION_KEY || env.PAYLOAD_SECRET
  const lookupKey = createHash('sha256').update(`${LOOKUP_LABEL_PREFIX}:${secret}`).digest()
  return createHmac('sha256', lookupKey).update(digits).digest('hex')
}

/** Mask a full PAN for display, e.g. `•••• •••• •••• 1234`. */
export const maskPan = (pan: string): string => {
  const digits = pan.replace(/\D/g, '').slice(-4)
  if (!digits) return ''
  return digits.length === 4 ? `•••• •••• •••• ${digits}` : `•••• ${digits}`
}

/** Mask a stored last-4 value for display. */
export const maskPanFromLast4 = (last4: string | null | undefined): string =>
  maskPan(last4 ?? '')