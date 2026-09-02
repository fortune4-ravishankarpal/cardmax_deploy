import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'

export const CardAuditLogs: CollectionConfig = {
	slug: 'card-audit-logs',
	labels: {
		singular: 'Card Audit Log',
		plural: 'Card Audit Logs',
	},
	admin: {
		useAsTitle: 'action',
		group: 'Master',
		defaultColumns: ['action', 'cardId', 'cardMasked', 'actorType', 'actorEmail', 'createdAt'],
	},
	access: {
		// Admins can review audit trails; records are written only server-side.
		read: ({ req }) => Boolean(req.user && req.user.collection === 'admin') && isAdmin({ req }),
		create: () => false,
		update: () => false,
		delete: () => false,
	},
	fields: [
		{
			name: 'action',
			type: 'select',
			required: true,
			index: true,
			admin: { position: 'sidebar', readOnly: true },
			options: [
				{ label: 'Card created', value: 'card_create' },
				{ label: 'Card updated', value: 'card_update' },
				{ label: 'Card deleted', value: 'card_delete' },
				{ label: 'Full PAN revealed', value: 'pan_reveal' },
				{ label: 'Exact PAN lookup', value: 'card_lookup' },
				{ label: 'Key rotation', value: 'card_key_rotation' },
			],
		},
		{
			name: 'cardId',
			type: 'text',
			index: true,
			admin: { position: 'sidebar', readOnly: true },
		},
		{
			// Masked PAN ONLY — never a full PAN..
			name: 'cardMasked',
			type: 'text',
			admin: { position: 'sidebar', readOnly: true },
		},
		{
			name: 'actorType',
			type: 'select',
			required: true,
			admin: { position: 'sidebar', readOnly: true },
			options: [
				{ label: 'Admin', value: 'admin' },
				{ label: 'User', value: 'users' },
			],
		},
		{
			name: 'actorId',
			type: 'text',
			required: true,
			index: true,
			admin: { position: 'sidebar', readOnly: true },
		},
		{
			name: 'actorEmail',
			type: 'text',
			admin: { position: 'sidebar', readOnly: true },
		},
		{
			name: 'ip',
			type: 'text',
			admin: { position: 'sidebar', readOnly: true },
		},
		{
			name: 'userAgent',
			type: 'text',
			admin: { readOnly: true },
		},
		{
			// Generic details — must NEVER contain PAN or other card auth data..
			name: 'details',
			type: 'textarea',
			admin: { readOnly: true },
		},
	],
}