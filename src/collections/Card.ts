import type { CollectionConfig } from 'payload'

import { cardEndpoints } from '@/cards/endpoints'
import { maskPanFromLast4 } from '@/cards/cardCrypto'
import { cardBeforeChange, cardBeforeValidate, cardAfterDelete } from '@/cards/hooks'
import {
  cardsReadAccess,
  cardsCreateAccess,
  cardsUpdateAccess,
  cardsDeleteAccess,
  cardsAdminAccess,
  denySensitiveFieldAccess,
} from '@/cards/access'

/**
 * Secure `cards` collection — PCI-sensitive card data vault..
 *
 * - The PAN and cardholder name are stored ONLY as authenticated AES-256-GCM
 *   ciphertext (`encryptedCardData`) — plaintext never reaches the database..
 * - The plaintext `panLast4` is kept for display/masking; `panLookup` is a
 *   deterministic HMAC-SHA-256 index for exact-match lookups (never reversible..
 * - Expiry month/year are non-PAN metadata stored as plaintext integers..
 * - All ciphertext/internal fields are unreadable/unwritable via REST, GraphQL,
 *   admin API, exports, or admin UI (field-level `read/create/update` denied..
 * - Rows are scoped: users see only their own cards; admins see all (masked..
 * - Creation is server-side only (the secure `/api/cards/add` endpoint encrypts
 *   before writing). Raw PAN/cardholder values are rejected by the collection hooks..
 */

export const Cards: CollectionConfig = {
  slug: 'cards',
  labels: {
    singular: 'Card',
    plural: 'Cards',
  },
  admin: {
    useAsTitle: 'panLast4',
    group: 'Users',
    defaultColumns: [
      'panMasked',
      'brand',
      'bank',
      'cardType',
      'nickname',
      'expiryMonth',
      'expiryYear',
      'updatedAt',
    ],
  },
  access: {
    read: cardsReadAccess,
    create: cardsCreateAccess,
    update: cardsUpdateAccess,
    delete: cardsDeleteAccess,
    admin: cardsAdminAccess,
  },
  hooks: {
    beforeValidate: [cardBeforeValidate],
    beforeChange: [cardBeforeChange],
    afterDelete: [cardAfterDelete],
  },
  endpoints: cardEndpoints,
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
      access: { read: () => true, create: () => false, update: () => false },
    },
    {
      name: 'nickname',
      type: 'text',
      admin: { position: 'sidebar', description: 'Optional label for this card (e.g. "My travel card").' },
    },
    {
      // Issuing bank — relationship to the `banks` master collection. The bank
      // CANNOT be derived from the stored data — the PAN is encrypted at rest,
      // and the auto-detected `brand` is the card network (Visa/Mastercard/...),
      // not the bank. Users pick the bank from the master list via the secure
      // card API; the ID is verified for existence in src/cards/service.ts..
      name: 'bank',
      type: 'relationship',
      relationTo: 'banks',
      index: true,
      admin: { description: 'Issuing bank for this card (from the bank master list).' },
    },
    {
      // Card kind — same vocabulary as the CreditCard catalog collection..
      name: 'cardType',
      type: 'select',
      options: [
        { label: 'Credit Card', value: 'credit_card' },
        { label: 'Secured Credit Card', value: 'secured_credit_card' },
        { label: 'Co-brand Credit Card', value: 'co_brand' },
      ],
      admin: { description: 'Kind of card (matches the card catalog vocabulary).' },
    },
    {
      name: 'brand',
      type: 'select',
      required: false,
      admin: { position: 'sidebar', readOnly: true },
      options: [
        { label: 'Visa', value: 'visa' },
        { label: 'Mastercard', value: 'mastercard' },
        { label: 'American Express', value: 'amex' },
        { label: 'RuPay', value: 'rupay' },
        { label: 'Unknown', value: 'unknown' },
      ],
      access: { create: () => false, update: () => false },
    },
    {
      name: 'bankName',
      type: 'text',
      admin: {
        description: 'The issuing bank name',
      }
    },
    {
      name: 'cardType',
      type: 'text',
      admin: {
        description: 'The type of card (Credit, Debit, etc.)',
      }
    },
    {
      // Plaintext last-4 digits — allowed for display and lookup; never the full PAN..
      name: 'panLast4',
      type: 'text',
      minLength: 4,
      maxLength: 4,
      index: true,
      admin: { hidden: true, readOnly: true },
      access: { read: () => true, create: () => false, update: () => false },
    },
    {
      // Deterministic HMAC-SHA-256 exact-match lookup value for the PAN..
      name: 'panLookup',
      type: 'text',
      index: true,
      admin: { hidden: true, readOnly: true },
      access: denySensitiveFieldAccess,
    },
    {
      name: 'expiryMonth',
      type: 'number',
      required: true,
      min: 1,
      max: 12,
      admin: { position: 'sidebar' },
      validate: (value: unknown) => {
        const n = Number(value) as number
        if (!Number.isInteger(n) || n < 1 || n > 12) return 'Expiry month must be an integer between 1 and 12.'
        return true
      },
    },
    {
      name: 'expiryYear',
      type: 'number',
      required: true,
      min: 2000,
      max: 2199,
      admin: { position: 'sidebar' },
      validate: (value: unknown) => {
        const n = Number(value) as number
        if (!Number.isInteger(n) || n < 2000 || n > 2199) return 'Expiry year must be between 2000 and 2199.'
        return true
      },
    },
    // --- Encrypted envelope (AES-256-GCM ciphertext + required metadata). ---
    // Set ONLY server-side by the secure card service before persistence..
    {
      name: 'encryptedCardData',
      type: 'textarea',
      admin: { hidden: true },
      access: denySensitiveFieldAccess,
    },
    {
      name: 'cardDataIv',
      type: 'text',
      admin: { hidden: true },
      access: denySensitiveFieldAccess,
    },
    {
      name: 'cardDataTag',
      type: 'text',
      admin: { hidden: true },
      access: denySensitiveFieldAccess,
    },
    {
      name: 'cardDataKeyVersion',
      type: 'text',
      admin: { hidden: true },
      access: denySensitiveFieldAccess,
    },
    {
      name: 'cardDataAlgorithm',
      type: 'text',
      admin: { hidden: true },
      access: denySensitiveFieldAccess,
    },
    {
      // Computed masked PAN for list/table views — never a full PAN..
      name: 'panMasked',
      type: 'text',
      virtual: true,
      admin: { position: 'sidebar', readOnly: true },
      hooks: {
        afterRead: [({ siblingData }: { siblingData: Record<string, unknown> | undefined }) =>
          maskPanFromLast4((siblingData as { panLast4?: string | null } | undefined)?.panLast4 ?? null),
        ],
      },
    },
  ],
}