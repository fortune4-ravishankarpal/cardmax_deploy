import type { CollectionConfig } from 'payload'
import { isApiAdmin } from '@/access/apiPermissionEngine'

export const APIUsers: CollectionConfig = {
  slug: 'api-users',
  admin: {
    useAsTitle: 'email',
    group: 'API Management',
    defaultColumns: ['name', 'email', 'role', 'status', 'createdAt'],
    description: 'API Administrators and Developers with granular collection-level permissions.',
  },
  auth: {
    useAPIKey: true,
    tokenExpiration: 86400 * 30, // 30 days
  },
  access: {
    // Only CMS Admins or API Admins can manage API Users
    read: ({ req }) => isApiAdmin(req.user),
    create: ({ req }) => isApiAdmin(req.user),
    update: ({ req }) => isApiAdmin(req.user),
    delete: ({ req }) => isApiAdmin(req.user),
    admin: ({ req }) => Boolean(req.user && (req.user.collection === 'admin' || (req.user.collection === 'api-users' && (req.user as any).role === 'admin'))),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'developer',
      saveToJWT: true,
      options: [
        { label: 'Administrator (Full Access)', value: 'admin' },
        { label: 'Developer (Restricted by Permissions)', value: 'developer' },
      ],
      admin: {
        description: 'Administrators have full access to all collections and methods. Developers only have access to explicitly assigned collections and methods.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      saveToJWT: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive / Suspended', value: 'inactive' },
      ],
    },
    {
      name: 'permissions',
      type: 'array',
      saveToJWT: true,
      admin: {
        condition: (data) => data?.role === 'developer',
        description: 'Assign specific collections and allowed HTTP methods to this developer.',
      },
      fields: [
        {
          name: 'collection',
          type: 'select',
          required: true,
          options: [
{ label: 'Users (users)', value: 'users' },
            { label: 'OTP Records (otp)', value: 'otp' },
            { label: 'Banks (banks)', value: 'banks' },
            { label: 'Cards (cards)', value: 'cards' },
            { label: 'Credit Cards (CreditCard)', value: 'CreditCard' },
            { label: 'Category Master (category-master)', value: 'category-master' },
            { label: 'Merchant Master (merchant-master)', value: 'merchant-master' },
            { label: 'Subscription Plans (subscription-plans)', value: 'subscription-plans' },
            { label: 'Subscriptions (subscriptions)', value: 'subscriptions' },
            { label: 'Statements (statements)', value: 'statements' },
            { label: 'User Cards (user-cards)', value: 'user-cards' },
            { label: 'User Goals (user-goals)', value: 'user-goals' },
            { label: 'Notifications (notifications)', value: 'notifications' },
            { label: 'Consents (consents)', value: 'consents' },
            { label: 'Media (media)', value: 'media' },
            { label: 'Feature Flags (feature-flags)', value: 'feature-flags' },
            { label: 'Admin (admin)', value: 'admin' },
            { label: 'Api Users (api-users)', value: 'api-users' },
            { label: 'Gmail Connections (gmail-connections)', value: 'gmail-connections' },
            { label: 'Consent Events (consent-events)', value: 'consent-events' },
            { label: 'Trial Eligibility (trial-eligibility)', value: 'trial-eligibility' },
            { label: 'Subscription Payments (subscription-payments)', value: 'subscription-payments' },
            { label: 'Provider Events (provider-events)', value: 'provider-events' },
            { label: 'Subscription Events (subscription-events)', value: 'subscription-events' },
            { label: 'Analytics Events (analytics-events)', value: 'analytics-events' },
            { label: 'Max Pro Events (max-pro-events)', value: 'max-pro-events' },
            { label: 'Card Audit Logs (card-audit-logs)', value: 'card-audit-logs' },
            { label: 'Device Tokens (device-tokens)', value: 'device-tokens' },
            { label: 'Notification Templates (notification-templates)', value: 'notification-templates' },
            { label: 'Card Applications (card-applications)', value: 'card-applications' },
          ],
        },
        {
          name: 'methods',
          type: 'select',
          hasMany: true,
          required: true,
          defaultValue: ['read'],
          options: [
            { label: 'Read (GET)', value: 'read' },
            { label: 'Create (POST)', value: 'create' },
            { label: 'Update (PUT / PATCH)', value: 'update' },
            { label: 'Delete (DELETE)', value: 'delete' },
          ],
        },
      ],
    },
    {
      name: 'allowedEndpoints',
      type: 'select',
      hasMany: true,
      saveToJWT: true,
      admin: {
        condition: (data) => data?.role === 'developer',
        description: 'Grant access to specific custom API endpoints (e.g. Send OTP, Verify OTP). Leave empty if granting access via collection permissions.',
      },
      options: [
        { label: 'Send OTP (POST /api/users/send-otp)', value: '/api/users/send-otp' },
        { label: 'Verify OTP (POST /api/users/verify-otp)', value: '/api/users/verify-otp' },
        { label: 'Complete Profile (POST /api/users/complete-profile)', value: '/api/users/complete-profile' },
        { label: 'Get Profile (GET /api/users/profile)', value: '/api/users/profile' },
        { label: 'Logout (POST /api/users/logout)', value: '/api/users/logout' },
      ],
    },
  ],
}
