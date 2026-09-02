import type { CollectionAfterDeleteHook, CollectionBeforeChangeHook, CollectionBeforeValidateHook } from 'payload'

import { CardError } from './errors'
import { assertNoProhibitedCardData } from './validation'
import { maskPanFromLast4 } from './cardCrypto'
import { callerFromReq } from './audit'
import { writeCardAuditLog } from './audit'

/**
 * Hooks for the secure `cards` collection.
 *
 * Raw PAN/cardholder-name values may never reach validation or persistence
 * through direct payload operations — they are actively rejected here. The only
 * way card data is written is through the secure service layer, which encrypts
 * the PAN into an AES-256-GCM envelope BEFORE calling payload.create/update..
 *
 * CVV/CVC/CID, PIN/PIN block, track/stripe/chip data is rejected by
 * `assertNoProhibitedCardData` before anything else can happen..
 */

const RAW_SENSITIVE_KEYS = ['cardNumber', 'pan', 'cardholderName'] as const

export const cardBeforeValidate: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  const record = data as Record<string, unknown> | undefined
  if (record) {
    assertNoProhibitedCardData(record)

    // Direct persistence of raw card values is forbidden — use the secure API..
    for (const key of RAW_SENSITIVE_KEYS) {
      if (key in record) {
        throw new CardError(
          'CARD_PAN_USE_SERVICE',
          'Raw card numbers and cardholder names cannot be persisted directly. Use the secure card endpoints so sensitive values are encrypted before storage.',
          400,
        )
      }
    }

    // Owning users are bound to their own record on create/update..
    const user = req.user as { collection?: string; id?: string } | null
    if (operation === 'create' && user?.collection === 'users') {
      record.user = user.id
    }
  }
  return data
}

export const cardBeforeChange: CollectionBeforeChangeHook = async ({ data, operation }) => {
  const record = data as Record<string, unknown> | undefined
  if (record && operation === 'create') {
    // Every create must carry an encrypted envelope — only the service layer can
    // produce one (it re-validates and encrypts the PAN before calling create..
    const hasEnvelope =
      typeof record.encryptedCardData === 'string' &&
      typeof record.cardDataIv === 'string' &&
      typeof record.cardDataTag === 'string' &&
      typeof record.cardDataKeyVersion === 'string' &&
      typeof record.cardDataAlgorithm === 'string'
    if (!hasEnvelope) {
      throw new CardError(
        'CARD_ENVELOPE_REQUIRED',
        'Card records can only be created through the secure card API so the PAN is encrypted before storage.',
        400,
      )
    }
  }
  return data
}

export const cardAfterDelete: CollectionAfterDeleteHook = async ({ req, id, doc }) => {
  const caller = callerFromReq(req)
  await writeCardAuditLog(req.payload, {
    action: 'card_delete',
    cardId: String(id),
    cardMasked: maskPanFromLast4((doc as { panLast4?: string | null } | null)?.panLast4 ?? null),
    actorType: caller.type,
    actorId: caller.id,
    actorEmail: caller.email,
    ip: caller.ip,
    userAgent: caller.userAgent,
  })
}