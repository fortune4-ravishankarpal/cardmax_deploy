import type { Payload } from 'payload'

import { checkIsSuperAdmin } from '@/access/isAdmin'

import { canManageCards, canRevealCardPan } from './access'
import { writeCardAuditLog, type CardCaller } from './audit'
import {
  decryptCardEnvelope,
  derivePanLookup,
  encryptCardEnvelope,
  getCurrentCardKeyVersion,
  maskPanFromLast4,
  rotateCardEnvelope,
  type CardEnvelopeCipher,
} from './cardCrypto'
import { CardError } from './errors'
import {
  assertNoProhibitedCardData,
  validateAndNormalizeCardInput,
  type CardBrand,
} from './validation'

/**
 * Secure card vault service — the ONLY code path that writes/decrypts card data..
 *
 * Every function applies caller authorization, encrypts plaintext into an
 * AES-256-GCM envelope BEFORE persistence,and writes an audit log entry
 * for sensitive operations. Raw PAN/cardholder-name values never appear in the
 * `data` passed to payload.create/update — only ciphertext + metadata..
 *
 * Exports/console/debug of these functions must never include a PAN..
 */

/** Shape of a card document as stored (internal fields included). */
export interface StoredCardDoc {
  id: string
  user?: { id: string } | string | null
  nickname?: string | null
  brand?: string | null
  panLast4?: string | null
  panLookup?: string | null
  expiryMonth?: number | null
  expiryYear?: number | null
  encryptedCardData?: string | null
	cardDataIv?: string | null
	cardDataTag?: string | null
	cardDataKeyVersion?: string | null
	cardDataAlgorithm?: string | null
	panMasked?: string | null
	createdAt?: string | null
	updatedAt?: string | null
}

/** Public, sanitized card view — explicit whitelist, NEVER ciphertext/lookup. */
export interface CardPublicView {
  id: string
  user?: string | null
  nickname?: string | null
  brand?: string | null
  panMasked?: string | null
  panLast4?: string | null
  expiryMonth?: number | null
	expiryYear?: number | null
	createdAt?: string | null
	updatedAt?: string | null
}

/** Whitelist projection — strips every internal/sensitive field. */
export const toCardPublicView = (doc: StoredCardDoc): CardPublicView => ({
  id: doc.id,
  user: typeof doc.user === 'object' && doc.user ? String((doc.user as { id: string }).id) : (doc.user ?? null),
  nickname: doc.nickname ?? null,
  brand: doc.brand ?? null,
  panMasked: doc.panMasked ?? maskPanFromLast4(doc.panLast4 ?? null),
  panLast4: doc.panLast4 ?? null,
  expiryMonth: doc.expiryMonth ?? null,
	expiryYear: doc.expiryYear ?? null,
	createdAt: doc.createdAt ?? null,
	updatedAt: doc.updatedAt ?? null,
})

const findCardDoc = async (payload: Payload, id: string): Promise<StoredCardDoc> => {
  const doc = (await payload.findByID({
    collection: 'cards',
    id,
    depth: 0,
    overrideAccess: true,
  })) as StoredCardDoc | null
  if (!doc) throw new CardError('CARD_NOT_FOUND', 'Card not found.', 404)
  return doc
}

/** Reconstruct the stored envelope (ciphertext + metadata) from a card document. */
const cipherFromDoc = (doc: StoredCardDoc): CardEnvelopeCipher => ({
  encrypted: doc.encryptedCardData ?? '',
  iv: doc.cardDataIv ?? '',
  tag: doc.cardDataTag ?? '',
  keyVersion: doc.cardDataKeyVersion ?? '',
  algorithm: doc.cardDataAlgorithm ?? 'AES-256-GCM',
})

/** Scoped authorization helper used by service operations. */
const authorizeForCard = (
  caller: CardCaller,
	doc: StoredCardDoc,
  opts: { adminPermission: 'manage' | 'reveal' } = { adminPermission: 'manage' },
): void => {
  const ownerId = typeof doc.user === 'object' && doc.user
    ? String((doc.user as { id: string }).id)
    : String(doc.user ?? '')
  if (caller.type === 'users') {
    if (!caller.id || ownerId !== caller.id) {
      throw new CardError('CARD_FORBIDDEN', 'You do not have access to this card.', 403)
    }
    return
  }
  if (caller.type === 'admin') {
    if (!caller.admin) throw new CardError('CARD_FORBIDDEN', 'Authentication required.', 401)
    const allowed = opts.adminPermission === 'reveal'
      ? canRevealCardPan(caller.admin)
      : canManageCards(caller.admin)

		if (!allowed) {
      throw new CardError(
        'CARD_FORBIDDEN',
        opts.adminPermission === 'reveal'
          ? 'Your admin role is not authorized to reveal full card numbers.'
          : 'Your admin role is not permitted to manage stored cards.',
        403,
      )
    }
    return
  }
  throw new CardError('UNAUTHENTICATED', 'Authentication required.', 401)
}

/**
 * Create a stored card for the authenticated owning user..
 *
 * The PAN and cardholder name are encrypted (AES-256-GCM) BEFORE the
 * payload.create call — plaintext never reaches the database or the request body
 * of the underlying data layer..
 */
export const createCard = async (
  payload: Payload,
	caller: CardCaller,
  input: Record<string, unknown>,
): Promise<CardPublicView> => {
  if (caller.type !== 'users' || !caller.id) {
    throw new CardError('UNAUTHENTICATED', 'Only an authenticated user can add their own card.', 401)
  }
  assertNoProhibitedCardData(input)
  const normalized = validateAndNormalizeCardInput(input, { requirePan: true })
  const cipher = encryptCardEnvelope({
    pan: normalized.pan as string,
    cardholderName: normalized.cardholderName as string,
  })

	 const doc = (await payload.create({
    collection: 'cards',
    data: {
      user: caller.id,
      nickname: normalized.nickname,
      brand: normalized.brand,
      expiryMonth: normalized.expiryMonth!,
      expiryYear: normalized.expiryYear!,
      panLast4: normalized.last4,
      panLookup: derivePanLookup(normalized.pan as string),
      encryptedCardData: cipher.encrypted,
      cardDataIv: cipher.iv,
      cardDataTag: cipher.tag,
      cardDataKeyVersion: cipher.keyVersion,
      cardDataAlgorithm: cipher.algorithm,
    },
    overrideAccess: true,
  })) as StoredCardDoc

	 await writeCardAuditLog(payload, {
    action: 'card_create',
    cardId: String(doc.id),
    cardMasked: maskPanFromLast4(normalized.last4 as string),
    actorType: 'users',
    actorId: caller.id,
    actorEmail: caller.email,
    ip: caller.ip,
    userAgent: caller.userAgent,
  })
  return toCardPublicView(doc)
}

/** Load a card after checking the caller may access/manage it. */
export const findCardForCaller = async (
  payload: Payload,
	caller: CardCaller,
  id: string,
): Promise<StoredCardDoc> => {
  const doc = await findCardDoc(payload, id)
  authorizeForCard(caller, doc, { adminPermission: 'manage' })
  return doc
}

/** Delete a stored card (owner or authorized admin). */
export const deleteCard = async (
  payload: Payload,
	caller: CardCaller,
  id: string,
): Promise<{ id: string }> => {
  const doc = await findCardForCaller(payload, caller, id)
  await payload.delete({ collection: 'cards', id, overrideAccess: true })
	 await writeCardAuditLog(payload, {
    action: 'card_delete',
    cardId: String(id),
    cardMasked: maskPanFromLast4(doc.panLast4 ?? null),
    actorType: caller.type,
    actorId: caller.id,
    actorEmail: caller.email,
    ip: caller.ip,
    userAgent: caller.userAgent,
  })
  return { id: String(id) }
}

/**
 * Update a stored card..
 *
 * When the PAN or cardholder name is changed, the existing envelope is decrypted
 * (server-side), merged with the incoming values,and re-encrypted with the current
 * key version before the update is persisted. Metadata-only updates (nickname,
 * expiry) never touch the envelope..
 */
export const updateCard = async (
  payload: Payload,
	caller: CardCaller,
  id: string,
  input: Record<string, unknown>,
): Promise<CardPublicView> => {
  const doc = await findCardForCaller(payload, caller, id)
  assertNoProhibitedCardData(input)
  const normalized = validateAndNormalizeCardInput(input, {
    existingBrand: (doc.brand as CardBrand | null) ?? null,
  })

	 let envelopeWrite: CardEnvelopeCipher | undefined
  let lookup: string | undefined
  let brand = normalized.brand ?? (doc.brand ?? 'unknown')
  const touchesEnvelope = normalized.pan !== undefined || normalized.cardholderName !== undefined

	 if (touchesEnvelope) {
    let currentPan: string | undefined
    let currentName: string | undefined
    try {
      const current = decryptCardEnvelope(cipherFromDoc(doc))
      currentPan = current.pan
      currentName = current.cardholderName
    } catch {
      currentPan = normalized.pan
    }
    const pan = normalized.pan ?? currentPan
    const name = normalized.cardholderName ?? currentName
    if (!pan || !name) {
      throw new CardError(
        'CARD_ENVELOPE_INVALID',
        'Cannot update card data —the existing encrypted record could not be read. Please re-enter the card number.',
        400,
      )
    }
    envelopeWrite = encryptCardEnvelope({ pan, cardholderName: name })
    if (normalized.pan) {
      lookup = derivePanLookup(normalized.pan)
      brand = normalized.brand ?? brand
    }
  }

	 const data: Record<string, unknown> = {}
  if (envelopeWrite) {
    Object.assign(data, {
      encryptedCardData: envelopeWrite.encrypted,
      cardDataIv: envelopeWrite.iv,
      cardDataTag: envelopeWrite.tag,
      cardDataKeyVersion: envelopeWrite.keyVersion,
      cardDataAlgorithm: envelopeWrite.algorithm,
    })
  }
  if (normalized.pan) {
    data.panLast4 = normalized.last4
    data.panLookup = lookup
    data.brand = brand
  }
	 if (normalized.expiryMonth !== undefined) data.expiryMonth = normalized.expiryMonth
 
 if (normalized.expiryYear !== undefined) data.expiryYear = normalized.expiryYear
 
 if (normalized.nickname !== undefined) data.nickname = normalized.nickname
 
 const updated = (await payload.update({
    collection: 'cards',
    id,
    data,
    overrideAccess: true,
  })) as StoredCardDoc

	 await writeCardAuditLog(payload, {
    action: 'card_update',
    cardId: String(updated.id),
    cardMasked: maskPanFromLast4(updated.panLast4 ?? null),
    actorType: caller.type,
    actorId: caller.id,
    actorEmail: caller.email,
    ip: caller.ip,
    userAgent: caller.userAgent,
  })
  return toCardPublicView(updated)
}

/**
 * REVEAL the full PAN + cardholder name — controlled decryption..
 *
 * Authorization:the owning user, or an admin whose role explicitly grants
 * `cards.reveal`-style permission (safe default: super_admin only..
 * Every reveal is audited (masked PAN only — the full PAN never enters logs..
 */
export const revealCardPan = async (
  payload: Payload,
	caller: CardCaller,
  id: string,
): Promise<{
  id: string
  pan: string
  cardholderName: string
  expiryMonth: number | null
  expiryYear: number | null
  panMasked: string
}> => {
  const doc = await findCardDoc(payload, id)
  authorizeForCard(caller, doc, { adminPermission: 'reveal' })
	 const plain = decryptCardEnvelope(cipherFromDoc(doc))
	 await writeCardAuditLog(payload, {
    action: 'pan_reveal',
    cardId: String(doc.id),
    cardMasked: maskPanFromLast4(doc.panLast4 ?? null),
    actorType: caller.type,
    actorId: caller.id,
    actorEmail: caller.email,
    ip: caller.ip,
    userAgent: caller.userAgent,
  })
  return {
    id: String(doc.id),
    pan: plain.pan,
    cardholderName: plain.cardholderName,
    expiryMonth: doc.expiryMonth ?? null,
    expiryYear: doc.expiryYear ?? null,
    panMasked: maskPanFromLast4(doc.panLast4 ?? null),
  }
}

/**
 * Exact-match PAN lookup for authorized admins..
 *
 * Uses the deterministic HMAC lookup value — never reversible encryption, never
 * fuzzy search. Returns masked cards only (no PAN in the response..
 */
export const lookupCardByPan = async (
  payload: Payload,
	caller: CardCaller,
  pan: string,
): Promise<CardPublicView[]> => {
  if (caller.type !== 'admin' || !canManageCards(caller.admin ?? null)) {
    throw new CardError('CARD_FORBIDDEN', 'Only authorized admins can perform exact card lookups.', 403)
  }
	 const digits = pan.replace(/\D/g, '')
  if (!digits || digits.length < 12 || digits.length > 19) {
    throw new CardError('CARD_PAN_INVALID', 'A valid card number is required for exact lookup.', 400)
  }
	 const lookup = derivePanLookup(digits)
	 const result = await payload.find({
    collection: 'cards',
    where: { panLookup: { equals: lookup } },
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })
  await writeCardAuditLog(payload, {
    action: 'card_lookup',
    cardMasked: maskPanFromLast4(digits.slice(-4)),
    actorType: caller.type,
    actorId: caller.id,
    actorEmail: caller.email,
    ip: caller.ip,
    userAgent: caller.userAgent,
    details: 'Exact PAN lookup performed (HMAC index)',
  })
  return (result.docs as StoredCardDoc[]).map(toCardPublicView)
}

/**
 * Re-encrypt every stored card with the current key version..
 *
 * Super-admin only. Envelopes are rotated in place…the HMAC lookup index is
 * unchanged (it derives from the first-managed secret, so exact lookups survive rotation..
 */
export const rotateCardKeys = async (
  payload: Payload,
	caller: CardCaller,
): Promise<{ rotated: number; keyVersion: string }> => {
  if (caller.type !== 'admin' || !checkIsSuperAdmin(caller.admin ?? null)) {
    throw new CardError('CARD_FORBIDDEN', 'Only super admins can rotate card encryption keys.', 403)
  }
	 const keyVersion = getCurrentCardKeyVersion()
  let rotated = 0
  let page = 1
	 while (true) {
    const res = await payload.find({
      collection: 'cards',
      page,
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })
    for (const raw of res.docs as StoredCardDoc[]) {
      const cipher = rotateCardEnvelope(cipherFromDoc(raw))

      await payload.update({
        collection: 'cards',
        id: raw.id,
        data: {
          encryptedCardData: cipher.encrypted,
          cardDataIv: cipher.iv,
          cardDataTag: cipher.tag,
          cardDataKeyVersion: cipher.keyVersion,
          cardDataAlgorithm: cipher.algorithm,
        },
        overrideAccess: true,
      })
      rotated++
    }
    if (page >= (res.totalPages ?? 1)) break
    page++
  }
	 await writeCardAuditLog(payload, {
    action: 'card_key_rotation',
    actorType: 'admin',
    actorId: caller.id,
    actorEmail: caller.email,
    ip: caller.ip,
    userAgent: caller.userAgent,
    details: `Re-encrypted ${rotated} card record(s) as key version ${keyVersion}`,
  })
  return { rotated, keyVersion }
}