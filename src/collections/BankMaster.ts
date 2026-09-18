import { CollectionConfig } from 'payload'
import { FieldHook } from 'payload'
import slugify from 'slugify'
import { createApiAccess } from '@/access/apiPermissionEngine'
export const generateSlugHook: FieldHook = ({ value, data }) => {
    if (value) return slugify(value.trim()) || ''
    if (data?.name) {
        return slugify(data.name, {
            lower: true,
            strict: true,
            trim: true,
        })
    }
}
export const Banks: CollectionConfig = {
    slug: 'banks',
    access: createApiAccess('banks'),
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'dataVersion', 'code', 'status', 'country'],
        group: "Master"
    },
    trash: true,
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
            unique: true,
        },
        {
            name: 'dataVersion',
            type: 'text',
            required: true,
            admin: {
                readOnly: true,
                position: "sidebar",
                description: 'Human-readable identifier for the published bank ruleset.',
            },
        },
        {
            name: 'code',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'shortName',
            type: 'text',
        },
        {
            name: 'country',
            type: 'text',
            defaultValue: 'India',
        },
        {
            name: 'website',
            type: 'text',
        },
        {
            name: 'logo',
            type: 'upload',
            relationTo: 'media',
        },
        {
            name: 'statementConfig',
            type: 'group',
            fields: [
                {
                    name: 'parserType',
                    type: 'select',
                    options: [
                        { label: 'Dedicated Parser', value: 'dedicated' },
                        { label: 'Generic Parser', value: 'generic' },
                        { label: 'OCR + LLM', value: 'ocr_llm' },
                    ],
                },
                {
                    name: 'statementEmailSenders',
                    type: 'array',
                    fields: [
                        {
                            name: 'email',
                            type: 'text',
                        },
                    ],
                },
                {
                    name: 'statementSubjectPatterns',
                    type: 'array',
                    fields: [
                        {
                            name: 'pattern',
                            type: 'text',
                        },
                    ],
                },
                {
                    name: 'passwordHint',
                    type: 'textarea',
                },
            ],
        },
        {
            name: 'dataSource',
            type: 'select',
            options: [
                { label: 'Bank Website', value: 'bank_website' },
                { label: 'MITC', value: 'mitc' },
                { label: 'Statement', value: 'statement' },
                { label: 'Research', value: 'research' },
            ],
        },
        {
            name: 'lastVerifiedAt',
            type: 'date',
        },
        {
            name: 'notes',
            type: 'textarea',
        },
        {
            name: 'slug',
            type: 'text',
            unique: true,
            index: true,
            admin: {
                position: 'sidebar',
            },
            hooks: { beforeValidate: [generateSlugHook] },
        }
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
    },
}
