import { softDelete } from '@payload-pln/soft-delete'

export const softDeleteConfig = softDelete({
    disabled: false,
    collections: {
        'category-master': true,
    },
})
