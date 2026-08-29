import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto'

import { getEncryptionKey } from '@/auth/gmail/constants'

/**
 * AES-256-GCM encryption for Gmail OAuth refresh tokens.
 *
 * Refresh tokens are stored in the `gmail-connections` collection,
 * encrypted at rest. The key is derived from `GMAIL_ENCRYPTION_KEY`
 * (or `PAYLOAD_SECRET` as a fallback) via SHA-256 so it is always
 * exactly 32 bytes — the required length for AES-256.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

const deriveKey = (): Buffer => {
  return createHash('sha256').update(getEncryptionKey()).digest()
}

/** Encrypted token data stored alongside the connection record. */
export interface EncryptedTokenData {
  /** Base64-encoded ciphertext. */
  encrypted: string
  /** Base64-encoded initialization vector. */
  iv: string
  /** Hex-encoded authentication tag. */
  tag: string
}

/** Encrypt a plaintext refresh token using AES-256-GCM. */
export const encryptToken = (plaintext: string): EncryptedTokenData => {
  const key = deriveKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('hex'),
  }
}

/** Decrypt an encrypted refresh token using AES-256-GCM. */
export const decryptToken = (data: EncryptedTokenData): string => {
  const key = deriveKey()
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(data.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(data.tag, 'hex'))
  const decrypted = Buffer.concat([
    decipher.update(data.encrypted, 'base64'),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

/** Round-trip test: encrypt then decrypt should return the original text. */
export const verifyEncryption = (plaintext: string): boolean => {
  const encrypted = encryptToken(plaintext)
  const decrypted = decryptToken(encrypted)
  return decrypted === plaintext
}
