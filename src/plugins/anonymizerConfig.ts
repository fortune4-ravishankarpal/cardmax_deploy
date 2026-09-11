import { anonymizerMasking } from "@payload-pln/anonymizer-masking";

export const anonymizerMaskingConfig = anonymizerMasking({
    collections: {
        user: {
            userField: "id",
            fields: {
                name: null
            }
        }
    }
})