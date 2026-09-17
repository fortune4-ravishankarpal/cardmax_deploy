import type { CollectionConfig } from 'payload'
import slugify from 'slugify'

export const MerchantMaster: CollectionConfig = {
    slug: 'merchant-master',
    labels: {
        singular: 'Merchant',
        plural: 'Merchants',
    },
    admin: {
        useAsTitle: 'name',
        group: "Master"
    },
    versions: {
        drafts: true,
    },
    trash: true,
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            hooks: {
                beforeValidate: [
                    ({ value, data }) => {
                        const source = data?.name || value

                        if (!source) return value

                        return slugify(source, {
                            lower: true,
                            strict: true,
                            trim: true,
                        })
                    },
                ],
            },
        },
        {
            name: 'category',
            type: 'relationship',
            relationTo: "category-master",
            required: false,
            index: false,
            hasMany: true,
        },
    ],
}
