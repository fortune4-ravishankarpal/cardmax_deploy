/*
import { privacyPlugin } from 'payload-plugin-anonymizer'
export const privacyPluginConfig = privacyPlugin({
    enabled: true,
    userCollection: 'users',
    privacyRequestCollection: 'privacy-requests',
    consentCollection: 'privacy-consents',
    auditCollection: 'privacy-audit-logs',
    deletion: {
        mode: 'anonymise',
        allowPermanentDelete: false,
    },
    collections: {
        users: {
            enabled: true,
            strategy: 'anonymise',
            fields: {
                email: { action: 'mask', classification: 'personal' },
                phone: { action: 'null', classification: 'personal' },
                name: { action: 'mask', classification: 'personal' },
            },
        },
    },
})
    */