import { payloadEnhancedSidebar } from '@veiag/payload-enhanced-sidebar'
import { checkIsSuperAdmin } from '@/access/isAdmin'
let SideBarAccessViewChecker = ({ req, item }: any) => {
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
      id: 'content',
      type: 'tab',
      icon: 'FileText',
      label: { en: 'Content' },
      collections: ['pages', 'posts', 'categories', 'media'],
      access: SideBarAccessViewChecker,
    },
    {
      id: 'forms',
      type: 'tab',
      icon: 'Form',
      label: { en: 'Forms' },
      collections: ['forms', 'form-submissions'],
      access: SideBarAccessViewChecker,
    },
    {
      id: 'audit',
      type: 'tab',
      icon: 'History',
      label: { en: 'Audit & Debug' },
      collections: ['audit-demo', 'redirects'],
      access: SideBarAccessViewChecker,
    },
    {
      id: 'settings',
      type: 'tab',
      icon: 'Settings',
      label: { en: 'Settings' },
      collections: ['users', 'roles', 'tenants', 'content-freeze-settings' as any],
      globals: ['header', 'footer'],

      access: SideBarAccessViewChecker,
    },
  ],
})
