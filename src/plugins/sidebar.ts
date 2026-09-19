import { payloadEnhancedSidebar } from '@veiag/payload-enhanced-sidebar'
import { checkIsSuperAdmin } from '@/access/isAdmin'
const SideBarAccessViewChecker = ({ req, item }: any) => {
  if (!req.user) return false

  const isSuperAdmin = checkIsSuperAdmin(req.user)
  if (isSuperAdmin) {
    return true
  }

  if (item.type === 'link') {
    return true
  }

  const role = req.user.role
  const permissions =
    typeof role === 'object' && role !== null && 'permissions' in role
      ? (role.permissions as string[]) || []
      : []

  const checkAccess = (slug: string) => {
    return permissions.some(
      (p) =>
        p === '*' ||
        p === '*.read' ||
        p === `${slug}.*` ||
        p === `${slug}.read` ||
        p === `${slug}.manage`,
    )
  }

  const visibleCollections = (item.collections || []).filter((slug: any) => checkAccess(slug))
  const visibleGlobals = (item.globals || []).filter((slug: any) => checkAccess(slug))

  return visibleCollections.length > 0 || visibleGlobals.length > 0
}
export const enhancedSidebarConfig = payloadEnhancedSidebar({
  tabs: [
    {
      id: 'dashboard',
      type: 'link',
      href: '/',
      icon: 'House',
      label: { en: 'Dashboard' },
      access: SideBarAccessViewChecker,
    },
    {
      id: 'users',
      type: 'tab',
      icon: 'Users',
      label: { en: 'Users' },
      collections: [
        'users',
        'cards',
        'card-applications',
        'consent-events',
        'gmail-connections',
        'otp',
        'statements',
      ],
      access: SideBarAccessViewChecker,
    },
    {
      id: 'Masters',
      type: 'tab',
      icon: 'Archive',
      label: { en: 'Master' },
      collections: [
        'banks',
        'CreditCard',
        'category-master',
        'merchant-master',
        'subscription-plans',
        'card-audit-logs',
      ],
      access: SideBarAccessViewChecker,
    },
    {
      id: 'wallets',
      type: 'tab',
      icon: 'Wallet',
      label: { en: 'Wallets & Users' },
      collections: ['user-cards'],
      access: SideBarAccessViewChecker,
    },
    {
      id: 'subscriptions',
      type: 'tab',
      icon: 'CreditCard',
      label: { en: 'Subscription & Max Pro' },
      collections: [
        'subscriptions',
        'subscription-payments',
        'subscription-events',
        'trial-eligibility',
        'provider-events',
        'max-pro-events',
        'user-goals',
      ],
      access: SideBarAccessViewChecker,
    },
    {
      id: 'engagement',
      type: 'tab',
      icon: 'Bell',
      label: { en: 'Engagement & Analytics' },
      collections: [
        'notifications',
        'analytics-events',
        'device-tokens',
        'notification-templates',
      ],
      access: SideBarAccessViewChecker,
    },
    {
      id: 'privacy',
      type: 'tab',
      icon: 'Shield',
      label: { en: 'Privacy & Settings' },
      collections: [
        'consents',
        'feature-flags',
        'anonymization-requests',
        'anonymized-identities',
        'anonymization-logs',
        'anonymization-metadata',
      ],
      access: SideBarAccessViewChecker,
    },
    {
      id: 'api-management',
      type: 'tab',
      icon: 'KeyRound',
      label: { en: 'API Management' },
      collections: ['api-users'],
      access: SideBarAccessViewChecker,
    },
    {
      id: 'content',
      type: 'tab',
      icon: 'FileText',
      label: { en: 'Content' },
      collections: ['media'],
      access: SideBarAccessViewChecker,
    },
    {
      id: 'system',
      type: 'tab',
      icon: 'Settings',
      label: { en: 'System' },
      collections: ['admin', 'roles'],
      access: SideBarAccessViewChecker,
    },
  ],
})
