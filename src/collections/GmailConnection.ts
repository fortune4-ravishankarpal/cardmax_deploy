import type { CollectionConfig } from 'payload'

/**
 * GmailConnection collection.
 *
 * Stores encrypted OAuth refresh tokens for users who have connected
 * their Gmail account. The refresh token is encrypted at rest using
 * AES-256-GCM — the plaintext never leaves the server.
 *
 * Access is restricted: only the owning user (via the server endpoints)
 * or an admin can read or modify these records. Token fields are hidden
 * from the REST API and admin UI.
 */
export const GmailConnection: CollectionConfig = {
  slug: 'gmail-connections',
  labels: {
    singular: 'Gmail Connection',
    plural: 'Gmail Connections',
  },
  admin: {
    useAsTitle: 'gmailAddress',
    group: 'Users',
    hidden: false,
  },
  access: {
    read: ({ req }) => {
      const user = req.user as { collection?: string; id?: number } | null
      if (!user) return false
      if (user.collection === 'admin') return true
      // Users can only read their own connection
      return {
        user: { equals: user.id },
      }
    },
    create: () => false, // Only created via server endpoints with overrideAccess
    update: () => false, // Only updated via server endpoints with overrideAccess
    delete: ({ req }) => {
      const user = req.user as { collection?: string; id?: number } | null
      if (!user) return false
      if (user.collection === 'admin') return true
      return {
        user: { equals: user.id },
      }
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'gmailAddress',
      type: 'email',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'encryptedRefreshToken',
      type: 'text',
      required: true,
      admin: { hidden: true },
      access: { read: () => false, update: () => false },
    },
    {
      name: 'tokenIv',
      type: 'text',
      required: true,
      admin: { hidden: true },
      access: { read: () => false, update: () => false },
    },
    {
      name: 'tokenTag',
      type: 'text',
      required: true,
      admin: { hidden: true },
      access: { read: () => false, update: () => false },
    },
    {
      name: 'scopes',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Revoked', value: 'revoked' },
        { label: 'Expired', value: 'expired' },
      ],
      defaultValue: 'active',
      index: true,
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'connectedAt',
      type: 'date',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'lastRefreshedAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
  ],
}
