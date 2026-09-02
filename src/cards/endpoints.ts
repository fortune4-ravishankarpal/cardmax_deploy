import type { Endpoint, PayloadRequest } from 'payload'

import { CardError } from './errors'
import { callerFromReq, type CardCaller } from './audit'
import {
  createCard,
  deleteCard,
  lookupCardByPan,
  revealCardPan,
  rotateCardKeys,
  updateCard,
} from './service'

/**
 * Custom REST endpoints for the secure `cards` collection..
 *
 * Mounted under `/api/cards/…`. Each endpoint authenticates the caller,
 * enforces collection/owner/role access, audits sensitive operations, and
 * returns ONLY sanitized (masked) card views — except `/reveal`, which returns
 * the full PAN to the authorized caller in a single controlled response..
 *
 * Custom endpoints are NOT authenticated by default — middleware here requires
 * `req.user` explicitly..
 */

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const readBody = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  try {
    if (typeof req.json !== 'function') return {}
    const raw = (await req.json()) as unknown
    return raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}

const requireCaller = (req: PayloadRequest): CardCaller => {
  const caller = callerFromReq(req)
  if (!caller.id) throw new CardError('UNAUTHENTICATED', 'Authentication required.', 401)
  return caller
}

/** Keep raw internal errors (which could mention card data) out of responses. */
const safeHandler = (fn: () => Promise<Response>): Promise<Response> =>
  fn().catch((e: unknown) => {
    if (e instanceof CardError) {
      return json({ error: e.message, code: e.code }, e.status)
    }
    return json({ error: 'Unexpected error.', code: 'CARD_ERROR' }, 500)
  })

/** POST /api/cards/add — create a stored card (authenticated owning user). */
const addCardEndpoint: Endpoint = {
  path: '/add',
  method: 'post',
  handler: (req) =>
    safeHandler(async () => {
      const caller = requireCaller(req)
      const body = await readBody(req)
      const card = await createCard(req.payload, caller, body)
      return json({ ok: true, card })
    }),
}

/** POST /api/cards/:id/update — update a stored card (owner or authorized admin). */
const updateCardEndpoint: Endpoint = {
  path: '/:id/update',
  method: 'post',
  handler: (req) =>
    safeHandler(async () => {
      const caller = requireCaller(req)
      const id = String(req.routeParams?.id ?? '')
      if (!id) throw new CardError('CARD_NOT_FOUND', 'Card not found.', 404)
      const body = await readBody(req)
      const card = await updateCard(req.payload, caller, id, body)
      return json({ ok: true, card })
    }),
}

/**
 * POST /api/cards/:id/reveal — controlled full-PAN reveal..
 *
 * Returns the full PAN/cardholder name ONLY to the owning user or an
 * admin role explicitly granted `cards.reveal`-style permission.
 * Every reveal is audited (masked PAN only in the audit log..
 */
const revealCardEndpoint: Endpoint = {
  path: '/:id/reveal',
  method: 'post',
  handler: (req) =>
    safeHandler(async () => {
      const caller = requireCaller(req)
      const id = String(req.routeParams?.id ?? '')
      if (!id) throw new CardError('CARD_NOT_FOUND', 'Card not found.', 404)
      const revealed = await revealCardPan(req.payload, caller, id)
      return json({ ok: true, data: revealed })
    }),
}

/**
 * POST /api/cards/lookup — exact-match PAN lookup (authorized admins only)..
 *
 * Uses the deterministic HMAC-SHA-256 lookup index. Returns masked cards only —
 * the full PAN never appears in the response/audit log..
 */
const lookupCardEndpoint: Endpoint = {
  path: '/lookup',
  method: 'post',
  handler: (req) =>
    safeHandler(async () => {
      const caller = requireCaller(req)
      const body = await readBody(req)
      const pan = typeof body.cardNumber === 'string' ? body.cardNumber : ''
      const matches = await lookupCardByPan(req.payload, caller, pan)
      return json({ ok: true, matches })
    }),
}

/**
 * POST /api/cards/rotate-keys — re-encrypt all cards with the current key
 * version (super admin only). Audited.
 */
const rotateKeysEndpoint: Endpoint = {
  path: '/rotate-keys',
  method: 'post',
  handler: (req) =>
    safeHandler(async () => {
      const caller = requireCaller(req)
      const result = await rotateCardKeys(req.payload, caller)
      return json({ ok: true, ...result })
    }),
}

export const cardEndpoints: Endpoint[] = [
  addCardEndpoint,
  updateCardEndpoint,
  revealCardEndpoint,
  lookupCardEndpoint,
  rotateKeysEndpoint,
]