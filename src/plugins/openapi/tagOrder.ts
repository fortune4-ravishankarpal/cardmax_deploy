/**
 * Defines the functional category ordering for Swagger / OpenAPI documentation.
 *
 * Hierarchy:
 * 1. Authentication (OTP & Session Login)
 * 2. Users & Identity (User Profile, Otp, Gmail, Consents, Goals)
 * 3. Cards & Banking (Cards, CreditCard catalog, UserCards, Banks, Statements, Applications, Masters)
 * 4. Subscriptions & Max Pro (Subscriptions, Plans, Payments, Events, Trials, Webhooks)
 * 5. Notifications (Alerts, Templates, Device Tokens)
 * 6. System & Analytics (Analytics, Flags, ApiUsers, Media)
 */

export const FUNCTIONAL_TAG_ORDER: string[] = [
  // 1. Authentication
  'Authentication',

  // 2. Users & Identity
  'Users',
  'Otp',
  'GmailConnections',
  'UserGoals',
  'Consents',
  'ConsentEvents',

  // 3. Cards & Banking
  'Cards',
  'CreditCard',
  'CreditCards',
  'UserCards',
  'Banks',
  'Statements',
  'CardApplications',
  'CategoryMaster',
  'MerchantMaster',
  'CardAuditLogs',

  // 4. Subscriptions & Max Pro
  'Subscriptions',
  'SubscriptionPlans',
  'SubscriptionPayments',
  'SubscriptionEvents',
  'TrialEligibility',
  'ProviderEvents',
  'ProviderEvent',
  'MaxProEvents',
  'MaxProEvent',

  // 5. Notifications
  'Notifications',
  'NotificationTemplates',
  'DeviceTokens',

  // 6. System & Analytics
  'AnalyticsEvents',
  'FeatureFlags',
  'ApiUsers',
  'Media',
]

export const TAG_METADATA: Record<string, { description: string }> = {
  Authentication: { description: 'OTP Generation, Verification & Session Authentication' },
  Users: { description: 'User Profile & Account Operations' },
  Otp: { description: 'OTP Delivery & Validation Records' },
  GmailConnections: { description: 'Gmail OAuth Connections & Statement Sync' },
  UserGoals: { description: 'Personal Financial Goals & Milestones' },
  Consents: { description: 'User Legal & Data Sharing Consents' },
  ConsentEvents: { description: 'Consent Audit & Lifecycle Logs' },

  Cards: { description: 'User Cards & Portfolio Operations' },
  CreditCard: { description: 'Credit Card Catalog & Reward Rules' },
  CreditCards: { description: 'Credit Card Catalog & Reward Rules' },
  UserCards: { description: 'User Linked Credit Cards' },
  Banks: { description: 'Partner & Supported Banking Institutions' },
  Statements: { description: 'Card Statements & Transaction Imports' },
  CardApplications: { description: 'Card Application Submissions & Tracking' },
  CategoryMaster: { description: 'Spend Categories & Multiplier Configurations' },
  MerchantMaster: { description: 'Merchant Classifications & Partner Metadata' },
  CardAuditLogs: { description: 'Card Changes & Security Audit Logs' },

  Subscriptions: { description: 'CardMax Pro Subscription Management' },
  SubscriptionPlans: { description: 'Tiered Pricing & Plan Configurations' },
  SubscriptionPayments: { description: 'Payment Processing & Razorpay Transactions' },
  SubscriptionEvents: { description: 'Billing & Subscription Event Logs' },
  TrialEligibility: { description: 'Pro Trial Qualification & Access' },
  ProviderEvents: { description: 'External Payment Gateway Webhook Events' },
  ProviderEvent: { description: 'External Payment Gateway Webhook Events' },
  MaxProEvents: { description: 'Max Pro Entitlements & Benefit Usages' },
  MaxProEvent: { description: 'Max Pro Entitlements & Benefit Usages' },

  Notifications: { description: 'User In-App Notifications & Alerts' },
  NotificationTemplates: { description: 'Notification Content Templates' },
  DeviceTokens: { description: 'FCM Push Notification Device Tokens' },

  AnalyticsEvents: { description: 'Telemetry & Behavioral Event Logs' },
  FeatureFlags: { description: 'Application Feature Flags & Toggles' },
  ApiUsers: { description: 'Developer Accounts & API Permission Management' },
  Media: { description: 'Uploaded Media Assets & Files' },
}

/**
 * Sorts tags according to the functional category order, falling back to alphabetical for unknown tags.
 */
export const sortTags = (
  tags: Array<{ name: string; description?: string }>
): Array<{ name: string; description?: string }> => {
  const getIndex = (name: string): number => {
    const idx = FUNCTIONAL_TAG_ORDER.findIndex(
      (t) => t.toLowerCase() === name.toLowerCase()
    )
    return idx === -1 ? 9999 : idx
  }

  return [...tags].sort((a, b) => {
    const idxA = getIndex(a.name)
    const idxB = getIndex(b.name)
    if (idxA !== idxB) {
      return idxA - idxB
    }
    return a.name.localeCompare(b.name)
  })
}
