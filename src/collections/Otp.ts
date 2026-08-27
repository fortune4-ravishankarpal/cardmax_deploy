import type { CollectionConfig } from 'payload'

export const Otp: CollectionConfig = {
  slug: 'otp',
  labels: {
    singular: 'OTP Record',
    plural: 'OTP Records',
  },
  admin: {
    useAsTitle: 'identifier',
    group: 'Users',
    hidden: false,
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: () => true,
  },
  trash: true,
  fields: [
    {
      name: 'identifier',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'channel',
      type: 'select',
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
      ],
      required: true,
    },
    {
      name: 'codeHash',
      type: 'text',
      required: true,
    },
    {
      name: 'salt',
      type: 'text',
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'number',
      required: true,
    },
    {
      name: 'attempts',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'maxAttempts',
      type: 'number',
      defaultValue: 5,
    },
    {
      name: 'lastSentAt',
      type: 'number',
      required: true,
    },
    {
      name: 'resendAt',
      type: 'number',
      required: true,
    },
  ],
}
