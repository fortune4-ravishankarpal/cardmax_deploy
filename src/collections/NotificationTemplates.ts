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
      admin: {
        description: 'Choose the event that triggers this notification. See the live Cheat Sheet below for exact variables and scenario.',
      },
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
    // ── Variables & Scenario Cheat Sheet ─────────────────────────────────
    {
      name: 'variablesCheatSheet',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/TemplateCheatSheet#TemplateCheatSheet',
        },
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
      type: 'code',
      admin: {
        language: 'html',
        description: 'Custom HTML Email Template. Write or paste full HTML here (supports inline CSS, buttons, tables, cards) and {{variableName}} interpolation. If left empty, the plain text body will be used.',
        condition: (_, siblingData) => siblingData?.channel === 'email',
      },
    },
    // ── Live HTML Email Preview ───────────────────────────────────────────
    {
      name: 'htmlPreview',
      type: 'ui',
      admin: {
        condition: (_, siblingData) => siblingData?.channel === 'email',
        components: {
          Field: '@/components/admin/HtmlEmailPreview#HtmlEmailPreview',
        },
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
