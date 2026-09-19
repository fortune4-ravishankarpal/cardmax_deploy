/**
 * Email Provider Abstraction
 *
 * Pluggable email delivery layer for the notification system.
 * Selected at runtime via EMAIL_PROVIDER and NOTIFICATION_MODE env vars.
 *
 * Providers:
 *   - MockEmailProvider    → simulation mode; logs, zero network calls
 *   - SmtpEmailProvider    → uses existing SMTP config (nodemailer) + optional DKIM
 *   - ResendEmailProvider  → Resend API (RESEND_API_KEY required)
 */
import { env } from '../../lib/env'

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface EmailMessage {
  to: string
  subject: string
  html: string
  from?: string
  isSimulation?: boolean
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
  mode?: 'simulation' | 'live'
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailSendResult>
}

// ─── Mock Provider (simulation) ───────────────────────────────────────────────

export class MockEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    console.log(
      `[EMAIL SIMULATION] To: ${message.to} | Subject: ${message.subject}`,
    )
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      mode: 'simulation',
    }
  }
}

// ─── SMTP Provider ────────────────────────────────────────────────────────────

export class SmtpEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    try {
      // @ts-ignore
      const nodemailer = await import('nodemailer')
      const transportOptions: Record<string, any> = {
        host: env.SMTP_HOST,
        port: 587,
        secure: false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      }

      // Optional DKIM signing
      if (env.DKIM_DOMAIN && env.DKIM_KEY_SELECTOR && env.DKIM_PRIVATE_KEY) {
        transportOptions.dkim = {
          domainName: env.DKIM_DOMAIN,
          keySelector: env.DKIM_KEY_SELECTOR,
          privateKey: env.DKIM_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }
      }

      const transporter = nodemailer.createTransport(transportOptions)

      const info = await transporter.sendMail({
        from: message.from || env.FROM_EMAIL,
        to: message.to,
        subject: message.subject,
        html: message.html,
      })

      return { success: true, messageId: info.messageId, mode: 'live' }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}

// ─── Resend Provider ──────────────────────────────────────────────────────────

export class ResendEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    if (!env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY is not configured' }
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: message.from || env.FROM_EMAIL,
          to: [message.to],
          subject: message.subject,
          html: message.html,
        }),
      })

      const data: any = await response.json()

      if (!response.ok) {
        return { success: false, error: data?.message || 'Resend API error' }
      }

      return { success: true, messageId: data.id, mode: 'live' }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
