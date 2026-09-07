import { softDelete } from '@payload-pln/soft-delete'

export const softDeleteConfig = softDelete({
    collections: {
        'category-master': true,
    },
})
