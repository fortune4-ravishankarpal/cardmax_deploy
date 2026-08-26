import type { Payload } from 'payload'

import type { IdentifierChannel } from '@/auth/types'
import { env } from '@/lib/env'

type SendContext = {
  destination: string
  channel: IdentifierChannel
  code: string
}

const getProvider = (): 'console' | 'email' | 'sms' => {
  return env.OTP_PROVIDER
}

const consoleSend = (ctx: SendContext): void => {
  // eslint-disable-next-line no-console
  console.info(`[otp:${ctx.channel}] code ${ctx.code} -> ${ctx.destination}`)
}

const emailSend = async (payload: Payload, ctx: SendContext): Promise<void> => {
  const from = env.OTP_EMAIL_FROM
  try {
    await payload.sendEmail({
      to: ctx.destination,
      from,
      subject: 'Your one-time verification code',
      html: `<p>Your CardMax verification code is <strong>${ctx.code}</strong>.</p><p>It expires in 5 minutes.</p>`,
    })
  } catch {
    consoleSend(ctx)
  }
}

const smsSend = (ctx: SendContext): void => {
  const configured =
    Boolean(env.OTP_SMS_ACCOUNT_SID) &&
    Boolean(env.OTP_SMS_AUTH_TOKEN) &&
    Boolean(env.OTP_SMS_FROM)

  if (!configured) {
    consoleSend(ctx)
    return
  }

  // Integration point for the configured SMS provider (${env.OTP_SMS_PROVIDER}).
  // Credentials are referenced from environment variables only.
  consoleSend(ctx)
}

export const sendOtpCode = async (
  payload: Payload,
  ctx: SendContext,
): Promise<void> => {
  const provider = getProvider()

  if (provider === 'email' && ctx.channel === 'email') {
    await emailSend(payload, ctx)
    return
  }

  if (provider === 'sms' && ctx.channel === 'phone') {
    smsSend(ctx)
    return
  }

  consoleSend(ctx)
}