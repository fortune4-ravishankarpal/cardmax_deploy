import type { CollectionConfig } from 'payload'

/**
 * Statements collection.
 *
 * Tracks credit-card statements ingested from Gmail (or uploaded as PDFs).
 * Each record references the user, the source, the issuer, and the parsed
 * metadata. The actual PDF file is stored in the `media` collection.
 */
export const Statements: CollectionConfig = {
  slug: 'statements',
  labels: {
    singular: 'Statement',
    plural: 'Statements',
  },
  admin: {
    useAsTitle: 'issuer',
    group: 'Users',
    hidden: false,
  },
  access: {
    read: ({ req }) => {
      const user = req.user as { collection?: string; id?: number } | null
      if (!user) return false
      if (user.collection === 'admin') return true
      // Users can read their own statements
      return {
        user: { equals: user.id },
      }
    },
    create: () => false, // Only created via server endpoints with overrideAccess
    update: ({ req }) => {
      const user = req.user as { collection?: string; id?: number } | null
      if (!user) return false
      if (user.collection === 'admin') return true
      return {
        user: { equals: user.id },
      }
    },
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
      name: 'source',
      type: 'select',
      options: [
        { label: 'Gmail', value: 'gmail' },
        { label: 'Upload', value: 'upload' },
      ],
      defaultValue: 'gmail',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'issuer',
      type: 'text',
      required: true,
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'gmailMessageId',
      type: 'text',
      admin: { position: 'sidebar', description: 'Gmail message ID of the source email' },
    },
    {
      name: 'attachmentFilename',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Parsed', value: 'parsed' },
        { label: 'Needs Review', value: 'needs_review' },
        { label: 'Error', value: 'error' },
      ],
      defaultValue: 'pending',
      index: true,
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'isUnrecognizedIssuer',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'True if statement was processed via generic fallback' },
    },
    {
      name: 'classificationConfidence',
      type: 'number',
      admin: { position: 'sidebar', description: 'Statement detection confidence score (0-1)' },
    },
    {
      name: 'classificationSignals',
      type: 'json',
      admin: { position: 'sidebar', description: 'Matched signals during classification and issuer detection' },
    },
    {
      name: 'paymentDueDate',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'minimumAmountDue',
      type: 'number',
      admin: { position: 'sidebar' },
    },
    {
      name: 'errorMessage',
      type: 'textarea',
      admin: { position: 'sidebar' },
    },
    {
      name: 'transactionCount',
      type: 'number',
      admin: { position: 'sidebar' },
    },
    {
      name: 'totalAmount',
      type: 'number',
      admin: { position: 'sidebar' },
    },
    {
      name: 'accountLast4',
      type: 'text',
      admin: { position: 'sidebar' },
    },
    {
      name: 'periodStart',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'periodEnd',
      type: 'date',
      admin: { position: 'sidebar' },
    },
    {
      name: 'pdf',
      type: 'relationship',
      relationTo: 'media',
      admin: { position: 'sidebar' },
    },
    {
      name: 'pdfSize',
      type: 'number',
      admin: { position: 'sidebar', description: 'Size of the PDF file in bytes' },
    },
    {
      name: 'parsedAt',
      type: 'date',
      admin: { position: 'sidebar' },
    },
  ],
}
