import type { CollectionConfig } from 'payload'

import { COOKIE_SECURE, COOKIE_SAME_SITE, SESSION_MAX_AGE_SECONDS } from '@/auth/constants'
import { EMPLOYMENT_TYPES, ACCOUNT_STATUS_OPTIONS } from '@/auth/profileOptions'
import {
  usersReadAccess,
  usersCreateAccess,
  usersUpdateAccess,
  usersDeleteAccess,
} from '@/auth/access'
import {
  sendOtpHandler,
  verifyOtpHandler,
  googleLoginHandler,
  googleCallbackHandler,
  completeProfileHandler,
  logoutHandler,
} from '@/auth/endpoints'
import {
  gmailConnectHandler,
  gmailCallbackHandler,
  gmailStatusHandler,
  gmailDisconnectHandler,
  gmailIngestHandler,
} from '@/auth/gmail/endpoints'
import { consentEndpoints } from '../consent/endpoints'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Users',
  },
  access: {
    read: usersReadAccess,
    create: usersCreateAccess,
    update: usersUpdateAccess,
    delete: usersDeleteAccess,
    admin: ({ req }) => req.user?.collection === 'admin',
  },
  auth: {
    tokenExpiration: SESSION_MAX_AGE_SECONDS,
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    cookies: {
      secure: COOKIE_SECURE,
      sameSite: COOKIE_SAME_SITE as 'Lax' | 'Strict' | 'None',
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'phone',
      type: 'text',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'authenticationProvider',
      type: 'select',
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'Google', value: 'google' },
      ],
      defaultValue: 'email',
      index: true,
      required: true,
      admin: { position: 'sidebar', readOnly: true },
      access: { read: () => true, update: () => false, create: () => true },
    },
    {
      name: 'authenticationProviderId',
      type: 'text',
      index: true,
      admin: { position: 'sidebar', readOnly: true },
      access: { update: () => false },
    },
    {
      name: 'profileCompleted',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'income',
      type: 'number',
      min: 0,
      admin: { position: 'sidebar' },
    },
    {
      name: 'employmentType',
      type: 'select',
      options: [...EMPLOYMENT_TYPES],
      admin: { position: 'sidebar' },
    },
    {
      name: 'accountStatus',
      type: 'select',
      options: [...ACCOUNT_STATUS_OPTIONS],
      defaultValue: 'active',
      index: true,
      required: true,
      admin: { position: 'sidebar' },
    },
  ],
  endpoints: [
    {
      path: '/send-otp',
      method: 'post',
      handler: sendOtpHandler,
    },
    {
      path: '/verify-otp',
      method: 'post',
      handler: verifyOtpHandler,
    },
    {
      path: '/complete-profile',
      method: 'post',
      handler: completeProfileHandler,
    },
    {
      path: '/logout',
      method: 'post',
      handler: logoutHandler,
    },
    {
      path: '/google/login',
      method: 'get',
      handler: googleLoginHandler,
    },
    {
      path: '/google/callback',
      method: 'get',
      handler: googleCallbackHandler,
    },
    {
      path: '/gmail/connect',
      method: 'get',
      handler: gmailConnectHandler,
    },
    {
      path: '/gmail/callback',
      method: 'get',
      handler: gmailCallbackHandler,
    },
    {
      path: '/gmail/status',
      method: 'get',
      handler: gmailStatusHandler,
    },
    {
      path: '/gmail/disconnect',
      method: 'post',
      handler: gmailDisconnectHandler,
    },
    {
      path: '/gmail/ingest',
      method: 'post',
      handler: gmailIngestHandler,
    },
    ...consentEndpoints,
  ],
}
