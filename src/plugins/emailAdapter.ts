import { env } from '@/lib/env'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

export const emailAdapter = nodemailerAdapter({
  defaultFromAddress: 'noreply@tenderbharo.com',
  defaultFromName: 'No-Reply',

  transportOptions: {
    host: env.SMTP_HOST,
    port: 587,
    secure: false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  },
})
