import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'
import slugify from 'slugify'

export const CreditCards: CollectionConfig = {
    slug: 'CreditCard',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'dataVersion', 'bank', 'category', 'merchant', 'state', 'cardType'],
        group: "Master"
    },
    trash: true,
    access: {
        readVersions: isAdmin,
        delete: isAdmin,
        update: async ({ req, data }) => {
            if (data && 'deletedAt' in data && data.deletedAt === null) {
                return isAdmin({ req })
            }
            return Boolean(req.user)
        },
        read: async ({ req }) => {
            if (!isAdmin({ req })) {
                return {
                    deletedAt: {
                        exists: false
                    }
                }
            }
            return Boolean(req.user)
        },
    },
    versions: {
        drafts: {
            autosave: {
                interval: 2000,
            }
        }
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'dataVersion',
            type: 'text',
            required: true,
            admin: {
                readOnly: true,
                position: "sidebar",
            },
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'bank',
            type: 'relationship',
            relationTo: 'banks',
            required: true,
            index: true,
        },
        {
            name: 'category',
            type: 'relationship',
            relationTo: 'category-master',
            index: true,
            admin: {
                position: 'sidebar',
                description: 'Spending category this card rewards (from the category master list).',
            },
        },
        {
            name: 'merchant',
            type: 'relationship',
            relationTo: 'merchant-master',
            index: true,
            admin: {
                position: 'sidebar',
                description: 'Co-brand / partnership merchant for this card (from the merchant master list).',
            },
        },
        {
            name: 'cardType',
            type: 'select',
            required: true,
            options: [
                { label: 'Credit Card', value: 'credit_card' },
                { label: 'Secured Credit Card', value: 'secured_credit_card' },
                { label: 'Co-brand Credit Card', value: 'co_brand' },
            ],
        },
        {
            name: 'network',
            type: 'select',
            options: [
                { label: 'Visa', value: 'visa' },
                { label: 'Mastercard', value: 'mastercard' },
                { label: 'American Express', value: 'amex' },
                { label: 'Discover', value: 'discover' },
                { label: 'RuPay', value: 'rupay' },
            ],
        },
        {
            name: 'state',
            type: 'select',
            required: true,
            defaultValue: 'active',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Invite Only', value: 'invite_only' },
                { label: 'Discontinued', value: 'discontinued' },
                { label: 'Pending Research', value: 'pending_research' },
            ],
        },

        {
            name: 'eligibility',
            type: 'group',
            fields: [
                {
                    name: 'minimumIncome',
                    type: 'number',
                },
                {
                    name: 'employmentTypes',
                    type: 'select',
                    hasMany: true,
                    options: [
                        { label: 'Salaried', value: 'salaried' },
                        { label: 'Self Employed', value: 'self_employed' },
                        { label: 'Business', value: 'business' },
                    ],
                },
                {
                    name: 'inviteOnly',
                    type: 'checkbox',
                    defaultValue: false,
                },
            ],
        },

        {
            name: 'fees',
            type: 'group',
            fields: [
                {
                    name: 'joiningFee',
                    type: 'number',
                },
                {
                    name: 'annualFee',
                    type: 'number',
                },
                {
                    name: 'renewalFee',
                    type: 'number',
                },
                {
                    name: 'feeWaiverThreshold',
                    type: 'number',
                },
            ],
        },

        {
            name: 'baseReward',
            type: 'group',
            fields: [
                {
                    name: 'type',
                    type: 'select',
                    required: true,
                    options: [
                        { label: 'Points', value: 'points' },
                        { label: 'Cashback', value: 'cashback' },
                    ],
                },
                {
                    name: 'pointsPerBlock',
                    type: 'number',
                },
                {
                    name: 'blockSize',
                    type: 'number',
                },
                {
                    name: 'cashbackPercentage',
                    type: 'number',
                },
            ],
        },

        {
            name: 'forexMarkup',
            type: 'number',
        },

        {
            name: 'fuelSurcharge',
            type: 'group',
            fields: [
                {
                    name: 'waived',
                    type: 'checkbox',
                },
                {
                    name: 'waiverPercentage',
                    type: 'number',
                },
                {
                    name: 'monthlyCap',
                    type: 'number',
                },
            ],
        },

        {
            name: 'pointValuation',
            type: 'group',
            fields: [
                {
                    name: 'realisticValue',
                    type: 'number',
                },
                {
                    name: 'ceilingValue',
                    type: 'number',
                },
            ],
        },

        {
            name: 'pointExpiry',
            type: 'number',
        },

        {
            name: 'image',
            type: 'upload',
            relationTo: 'media',
        },

        {
            name: 'description',
            type: 'textarea',
        },

        {
            name: 'lastVerifiedAt',
            type: 'date',
        },
    ],

    hooks: {
        beforeChange: [
            ({ data, operation, originalDoc }) => {
                // Draft and autosave operations must not alter the published ruleset label.
                if (data?._status !== 'published') {
                    return data
                }

                if (operation === 'create') {
                    data.dataVersion = 'v1'
                    return data
                }

                const currentVersion = originalDoc?.dataVersion
                const versionNumber = /^v(\d+)$/.exec(currentVersion ?? '')?.[1]
                data.dataVersion = `v${Number(versionNumber ?? 0) + 1}`

                return data
            },
        ],
        beforeValidate: [
            ({ data }) => {
                if (data?.name && !data?.slug) {
                    data.slug = slugify(data.name, {
                        lower: true,
                        strict: true,
                        trim: true,
                    })
                }

                return data
            },
        ],
        afterChange: [
            async ({ doc, previousDoc, req, operation }) => {
                // If this is an update and the document was published
                if (operation === 'update' && doc._status === 'published') {
                    // Check if points valuation dropped (devaluation)
                    const prevVal = previousDoc?.pointValuation?.realisticValue
                    const currentVal = doc.pointValuation?.realisticValue
                    
                    if (prevVal !== undefined && currentVal !== undefined && currentVal < prevVal) {
                         await req.payload.jobs.queue({
                             task: 'fanoutDevaluation',
                             input: {
                                 creditCardId: doc.id
                             }
                         })
                    }
                }
            }
        ]
    },
}
