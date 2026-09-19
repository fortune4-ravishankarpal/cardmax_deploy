/**
 * Email Domain Health & DNS Configuration Guide
 *
 * Generates the DNS record recommendations for SPF, DKIM, and DMARC
 * based on the currently active email provider.
 *
 * Accessible via GET /api/notifications/email-domain-health (admin only).
 *
 * DMARC Migration Path:
 *   1. p=none  (monitoring, receive reports)
 *   2. Validate alignment in aggregate reports for 2–4 weeks
 *   3. p=quarantine (move non-aligned to spam)
 *   4. p=reject (block non-aligned completely)
 */
import { env } from '../../lib/env'

export interface DnsRecord {
  type: 'TXT' | 'CNAME'
  host: string
  value: string
  ttl: number
}

export interface DomainHealthReport {
  domain: string
  provider: string
  mode: string
  spf: DnsRecord
  dkim: DnsRecord | null
  dmarc: DnsRecord
  notes: string[]
}

export function getDomainHealthReport(): DomainHealthReport {
  const domain = env.DKIM_DOMAIN || 'cardmax.com'
  const provider = env.EMAIL_PROVIDER || 'smtp'
  const mode = env.NOTIFICATION_MODE || 'simulation'

  // ── SPF Record ─────────────────────────────────────────────────────────────
  const spfValues: Record<string, string> = {
    smtp: `v=spf1 include:${env.SMTP_HOST || 'mail.cardmax.com'} ~all`,
    resend: 'v=spf1 include:sendgrid.net ~all',
    mock: 'v=spf1 ~all',
  }

  const spf: DnsRecord = {
    type: 'TXT',
    host: '@',
    value: spfValues[provider] || spfValues.smtp,
    ttl: 3600,
  }

  // ── DKIM Record ────────────────────────────────────────────────────────────
  let dkim: DnsRecord | null = null
  if (env.DKIM_KEY_SELECTOR && env.DKIM_DOMAIN) {
    dkim = {
      type: 'TXT',
      host: `${env.DKIM_KEY_SELECTOR}._domainkey.${domain}`,
      value: env.DKIM_PRIVATE_KEY
        ? '(DKIM public key — generate with openssl and place here)'
        : '(DKIM_PRIVATE_KEY not configured — generate keypair and configure)',
      ttl: 3600,
    }
  }

  // ── DMARC Record — starts at p=none (monitoring mode) ─────────────────────
  const dmarc: DnsRecord = {
    type: 'TXT',
    host: `_dmarc.${domain}`,
    value: `v=DMARC1; p=none; rua=mailto:dmarc-reports@${domain}; aspf=r; adkim=r`,
    ttl: 3600,
  }

  const notes: string[] = [
    `📌 Provider: ${provider} | Mode: ${mode}`,
    '📌 DMARC is configured in monitoring mode (p=none). This is correct for initial deployment.',
    '📌 Step 1: Deploy p=none and monitor dmarc-reports@' + domain + ' for 2–4 weeks.',
    '📌 Step 2: Once >95% of reports show passing alignment, move to p=quarantine.',
    '📌 Step 3: After another 2–4 weeks of clean reports, move to p=reject.',
    '📌 DKIM: Generate keypair with: openssl genrsa -out dkim_private.key 2048',
    '📌 DKIM: Extract public key: openssl rsa -in dkim_private.key -pubout -out dkim_public.key',
    '📌 Set DKIM_PRIVATE_KEY, DKIM_KEY_SELECTOR, and DKIM_DOMAIN env vars to enable DKIM signing.',
  ]

  if (mode === 'simulation') {
    notes.unshift('⚠️  NOTIFICATION_MODE=simulation — no real emails are being sent.')
  }

  return { domain, provider, mode, spf, dkim, dmarc, notes }
}
