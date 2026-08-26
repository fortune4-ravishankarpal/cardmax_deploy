import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { isAdmin, checkIsAdmin } from '@/access/isAdmin'

export const formBuilderPluginConfig = formBuilderPlugin({
  fields: {
    payment: false,
  },
  formSubmissionOverrides: {
    access: {
      read: isAdmin,
      create: () => true,
      update: isAdmin,
      delete: isAdmin,
    },
    admin: {
      group: 'Content',
      hidden: ({ user }) => !checkIsAdmin(user),
    },
  },
  formOverrides: {
    access: {
      read: isAdmin,
      update: isAdmin,
      delete: isAdmin,
      create: isAdmin,
    },
    admin: {
      group: 'Content',
      hidden: ({ user }) => !checkIsAdmin(user),
    },
    fields: ({ defaultFields }) => {
      return defaultFields.map((field) => {
        if ('name' in field && field.name === 'confirmationMessage') {
          return {
            ...field,
            editor: lexicalEditor({
              features: ({ rootFeatures }) => {
                return [
                  ...rootFeatures,
                  FixedToolbarFeature(),
                  HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                ]
              },
            }),
          }
        }
        return field
      })
    },
  },
})
