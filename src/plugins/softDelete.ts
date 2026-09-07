import { softDelete } from './soft-delete/index'

export const softDeleteConfig = softDelete({
    disabled: false,
    collections: {
        'category-master': true,
    },
})
