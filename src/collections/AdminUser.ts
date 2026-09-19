import { ValidationError, type CollectionConfig } from 'payload'

export const AdminUsers: CollectionConfig = {
  slug: 'admin',
  admin: {
    useAsTitle: 'email',
    group: 'System',
  },
  auth: true,
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && data.password) {
          const pwd = String(data.password)
          if (pwd.length < 8) {
            throw new ValidationError({
              errors: [{ message: 'Password must be at least 8 characters long.', path: 'password' }],
            })
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
      validate: (value: unknown) => {
        if (!value || typeof value !== 'string') return 'Email address is required.'
        const trimmed = value.trim()
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailRegex.test(trimmed)) {
          return 'Please enter a valid email address.'
        }
        return true
      },
    },
  ],
}
