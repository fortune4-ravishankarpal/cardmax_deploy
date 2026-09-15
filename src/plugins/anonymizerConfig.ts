import { isAdmin } from "@/access/isAdmin";
import { anonymizerMasking } from "@payload-pln/anonymizer-masking";

export const anonymizerMaskingConfig = anonymizerMasking({
    access: {
        admin: isAdmin
    },
    metadata: {
        enabled: true
    },
    collections: {
        user: {
            userField: "id",
            fields: {
                name: null
            }
        }
    }
})