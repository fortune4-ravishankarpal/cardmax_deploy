import type { Payload } from 'payload'
import { encryptToken, decryptToken } from '@/auth/gmail/encryption'
import type { GmailTokens } from '@/auth/gmail/types'
import { AuthorizationError } from '@/auth/services/otpService'

/** Shape of the `gmail-connections` collection document (as stored in Payload). */
interface GmailConnectionDoc {
  id: number | string
  user: { id: number | string } | number | string
  gmailAddress: string
  encryptedRefreshToken: string
  tokenIv: string
  tokenTag: string
  scopes: string
  connectedAt: string
  lastRefreshedAt: string | null
  status: 'active' | 'revoked' | 'expired'
}

/**
 * Find the active Gmail connection for a user.
 *
 * @returns the connection document, or `null` if none exists.
 */
export const findGmailConnection = async (
  payload: Payload,
  userId: number,
): Promise<GmailConnectionDoc | null> => {
  const result = await payload.find({
    collection: 'gmail-connections',
    where: {
      and: [
        { user: { equals: userId } },
        { status: { equals: 'active' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (result.docs[0] as GmailConnectionDoc) || null
}

/**
 * Save or update Gmail OAuth tokens for a user.
 *
 * The refresh token is encrypted with AES-256-GCM before storage.
 * If a connection already exists, it is updated; otherwise a new
 * record is created.
 */
export const saveGmailTokens = async (
  payload: Payload,
  userId: number,
  tokens: GmailTokens,
  gmailAddress: string,
): Promise<void> => {
  const existing = await findGmailConnection(payload, userId)
  const encrypted = encryptToken(tokens.refreshToken)

  const data: {
    user: number
    gmailAddress: string
    encryptedRefreshToken: string
    tokenIv: string
    tokenTag: string
    scopes: string
    connectedAt: string
    lastRefreshedAt: string
    status: 'active' | 'revoked' | 'expired'
  } = {
    user: userId,
    gmailAddress,
    encryptedRefreshToken: encrypted.encrypted,
    tokenIv: encrypted.iv,
    tokenTag: encrypted.tag,
    scopes: tokens.scope,
    connectedAt: existing ? existing.connectedAt : new Date().toISOString(),
    lastRefreshedAt: new Date().toISOString(),
    status: 'active',
  }

  if (existing) {
    await payload.update({
      collection: 'gmail-connections',
      id: existing.id,
      data: data as any,
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'gmail-connections',
      data: data as any,
      overrideAccess: true,
    })
  }
}

/**
 * Load and decrypt the Gmail tokens for a user.
 *
 * Throws `AuthorizationError` (GMAIL_NOT_CONNECTED) if no active
 * connection exists.
 */
export const loadGmailTokens = async (
  payload: Payload,
  userId: number,
): Promise<{
  refreshToken: string
  scopes: string
  gmailAddress: string
  connection: GmailConnectionDoc
}> => {
  const connection = await findGmailConnection(payload, userId)
  if (!connection) {
    throw new AuthorizationError('GMAIL_NOT_CONNECTED', 'Gmail is not connected.', 404)
  }

  const refreshToken = decryptToken({
    encrypted: connection.encryptedRefreshToken,
    iv: connection.tokenIv,
    tag: connection.tokenTag,
  })

  return {
    refreshToken,
    scopes: connection.scopes,
    gmailAddress: connection.gmailAddress,
    connection,
  }
}

/**
 * Delete the Gmail connection record for a user.
 *
 * This does NOT revoke the token at Google — use `revokeGmailToken`
 * for that. Call both to fully disconnect.
 */
export const deleteGmailConnection = async (payload: Payload, userId: number): Promise<void> => {
  const result = await payload.find({
    collection: 'gmail-connections',
    where: {
      and: [
        { user: { equals: userId } },
        { status: { equals: 'active' } },
      ],
    },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  for (const doc of result.docs) {
    await payload.delete({
      collection: 'gmail-connections',
      id: (doc as any).id,
      overrideAccess: true,
    })
  }
}

/**
 * Update the connection's last-refreshed timestamp and mark it
 * as active after a successful token refresh.
 */
export const touchConnection = async (
  payload: Payload,
  connectionId: number | string,
): Promise<void> => {
  await payload.update({
    collection: 'gmail-connections',
    id: connectionId,
    data: {
      lastRefreshedAt: new Date().toISOString(),
      status: 'active',
    },
    overrideAccess: true,
  })
}

/**
 * Check whether a user has a Gmail connection.
 */
export const hasGmailConnection = async (payload: Payload, userId: number): Promise<boolean> => {
  const connection = await findGmailConnection(payload, userId)
  return Boolean(connection)
}

/**
 * Get the public-facing Gmail connection status for a user.
 * Safe to call without admin privileges — no sensitive data is returned.
 */
export const getGmailConnectionStatus = async (
  payload: Payload,
  userId: number,
): Promise<{
  connected: boolean
  gmailAddress?: string
  connectedAt?: string
  scopes?: string
}> => {
  const connection = await findGmailConnection(payload, userId)
  if (!connection) {
    return { connected: false }
  }
  return {
    connected: true,
    gmailAddress: connection.gmailAddress,
    connectedAt: connection.connectedAt,
    scopes: connection.scopes,
  }
}
