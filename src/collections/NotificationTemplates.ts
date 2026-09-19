import type { CollectionConfig } from 'payload'
import { NOTIFICATION_EVENT_TYPES, NOTIFICATION_CHANNELS } from '../notifications/types'

/**
 * NotificationTemplates collection
 *
 * The primary source of truth for notification content, editable via Payload Admin.
 * NotificationService looks up an active template before falling back to code defaults.
 *
 * Fields:
 *   - eventType + channel = unique composite identifier for the active template
 *   - variables = document helper for template authors listing available {{var}} tokens
 */
export const NotificationTemplates: CollectionConfig = {
  slug: 'notification-templates',
  labels: { singular: 'Notification Template', plural: 'Notification Templates' },
  admin: {
    group: 'Engagement & Analytics',
    useAsTitle: 'name',
    defaultColumns: ['name', 'eventType', 'channel', 'isActive', 'updatedAt'],
    description: 'Admin-editable templates for push, in-app, and email notifications. These override code defaults.',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    create: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    update: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'admin'),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal name for this template, e.g. "Statement Analysis Ready – Email"',
      },
    },
    {
      name: 'eventType',
      type: 'select',
      options: NOTIFICATION_EVENT_TYPES.map((t) => ({
        label: t
          .split('_')
          .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
          .join(' '),
        value: t,
      })),
      required: true,
      index: true,
    },
    {
      name: 'channel',
      type: 'select',
      options: NOTIFICATION_CHANNELS.map((c) => ({
        label: c.replace(/_/g, ' ').toUpperCase(),
        value: c,
      })),
      required: true,
      index: true,
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      index: true,
      admin: {
        description: 'Only one active template per eventType+channel combination should exist.',
        position: 'sidebar',
      },
    },
    // ── Content fields ────────────────────────────────────────────────────
    {
      name: 'subject',
      type: 'text',
      admin: {
        description: 'Email subject line. Supports {{variableName}} interpolation.',
        condition: (_, siblingData) => siblingData?.channel === 'email',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Short title / push notification title. Supports {{variableName}} interpolation.',
      },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Notification body / push message. Supports {{variableName}} interpolation.',
      },
    },
    {
      name: 'html',
      type: 'richText',
      admin: {
        description: 'Rich HTML body for email channel. Supports {{variableName}} interpolation.',
        condition: (_, siblingData) => siblingData?.channel === 'email',
      },
    },
    // ── Variable documentation ────────────────────────────────────────────
    {
      name: 'variables',
      type: 'array',
      admin: {
        description: 'Document the template variables available for interpolation. For reference only.',
        initCollapsed: true,
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'text' },
      ],
    },
  ],
  timestamps: true,
}
