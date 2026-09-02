import type { Payload, PayloadRequest } from 'payload'

import type { Admin } from '@/payload-types'

/**
 * Audit logging for the secure card vault..
 *
 * Every sensitive-card-data operation (create/update/delete of card records,
 * decoder/full-PAN reveal, exact-PAN lookup, key rotation) is recorded here..
 *
 * Rules:
 * - NEVER log a PAN, cardholder name, expiry, or any card auth data..
 * - `cardMasked` stores the masked PAN ONLY (e.g. `•••• •••• •••• 1234`..
 * - `details` must never contain sensitive card values..
 * - Auditing fails open — a audit-write error must never break the primary op..
 */

export type CardAuditAction =
  | 'card_create'
  | 'card_update'
  | 'card_delete'
  | 'pan_reveal'
  | 'card_lookup'
  | 'card_key_rotation'

export interface CardAuditEntry {
  action: CardAuditAction
  cardId?: string
  cardMasked?: string
  actorType: 'users' | 'admin'
  actorId: string
  actorEmail?: string
  ip?: string
  userAgent?: string
  details?: string // NEVER PAN — e.g. "key version rotated to v2"
}

/** Identify the authenticated caller (and request metadata) for audit entries. */
export interface CardCaller {
  type: 'users' | 'admin'
  id: string
  email?: string
  ip?: string
  userAgent?: string
  admin?: Admin | null // populated for admin callers (role checks)
}

export const callerFromReq = (req: PayloadRequest): CardCaller => {
  const user = req.user as { collection?: string; id?: string; email?: string } | null
  const type = user?.collection === 'admin' ? 'admin' : 'users'
  const ip = req.headers?.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
  const userAgent = req.headers?.get('user-agent') || undefined
  return {
    type,
    id: String(user?.id ?? ''),
    email: user?.email,
    ip,
    userAgent,
    admin: type === 'admin' ? (user as Admin) : null,
  }
}

/** Persist an audit entry (server-side only; fails open on error). */
export const writeCardAuditLog = async (payload: Payload, entry: CardAuditEntry): Promise<void> => {
  try {
    await payload.create({
      collection: 'card-audit-logs',
      data: {
        action: entry.action,
        cardId: entry.cardId,
        cardMasked: entry.cardMasked,
        actorType: entry.actorType,
        actorId: entry.actorId,
        actorEmail: entry.actorEmail,
        ip: entry.ip,
        userAgent: entry.userAgent,
        details: entry.details,
      },
      overrideAccess: true,
    })
  } catch {
    // Fail open — auditing must not break card operations. Never log the error (no PAN..
  }
}