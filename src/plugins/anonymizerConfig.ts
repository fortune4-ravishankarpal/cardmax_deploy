import { isAdmin } from "@/access/isAdmin";
import { anonymizerMasking } from "@payload-pln/anonymizer-masking";

export const anonymizerMaskingConfig = anonymizerMasking({
    access: {
        admin: isAdmin
    },
    metadata: {
        enabled: true
    },
    requests: {
        approvedByRelationTo: "admin",
        userRelationTo: 'users',
    },
    collections: {
        users: {
            userField: "id",
            fields: {
                name: null
            }
        }
    }
})