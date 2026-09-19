import { env } from '@/lib/env'
import type { IssuerPattern } from '@/auth/gmail/types'

/**
 * Default issuer patterns for Indian credit-card providers.
 *
 * Each issuer defines:
 * - `senders` — email addresses or domains that appear in the `From` header.
 *   Matched as a case-insensitive substring, so domains like
 *   `@hdfcbank.com` naturally match all bank sub-domains.
 * - `subjectPatterns` — keywords that must appear in the email subject.
 * - `attachmentNamePatterns` — optional patterns for the PDF filename.
 *
 * These patterns are used to build Gmail search queries of the form:
 *   (from:sender1 OR from:sender2) ("Subject" OR "subject2") has:attachment filename:pdf
 */
export const DEFAULT_ISSUER_PATTERNS: IssuerPattern[] = [
  {
    name: 'HDFC Bank',
    senders: ['hdfcbank.com', 'statement@hdfcbank.com', 'noreply@hdfcbank.com', 'creditcard@hdfcbank.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'e-statement', 'e_statement'],
  },
  {
    name: 'SBI Card',
    senders: ['sbicard.com', 'noreply@sbicard.com', 'alerts@sbicard.com', 'banking@sbicard.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement', 'Monthly Statement'],
    attachmentNamePatterns: ['statement', 'sbi', 'e-statement'],
  },
  {
    name: 'ICICI Bank',
    senders: ['icicibank.com', 'noreply@icicibank.com', 'alerts@icicibank.com', 'creditcards@icicibank.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement', 'Credit Card Statement'],
    attachmentNamePatterns: ['statement', 'icici', 'e-statement'],
  },
  {
    name: 'Axis Bank',
    senders: ['axisbank.com', 'noreply@axisbank.com', 'alerts@axisbank.com', 'statement@axisbank.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement', 'Credit Card Statement'],
    attachmentNamePatterns: ['statement', 'axis', 'e-statement'],
  },
  {
    name: 'American Express',
    senders: ['americanexpress.com', 'noreply@americanexpress.com', 'alerts@americanexpress.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement', 'Monthly Statement'],
    attachmentNamePatterns: ['statement', 'amex', 'americanexpress', 'e-statement'],
  },
  {
    name: 'RBL Bank',
    senders: ['rblbank.com', 'noreply@rblbank.com', 'alerts@rblbank.com', 'banking@rblbank.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'rbl', 'e-statement'],
  },
  {
    name: 'YES Bank',
    senders: ['yesbank.com', 'noreply@yesbank.com', 'alerts@yesbank.com', 'banking@yesbank.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'yes', 'e-statement'],
  },
  {
    name: 'Federal Bank',
    senders: ['federalbank.co.in', 'noreply@federalbank.co.in', 'alerts@federalbank.co.in', 'banking@federalbank.co.in'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'federal', 'e-statement'],
  },
  {
    name: 'Kotak Mahindra',
    senders: ['kotak.com', 'noreply@kotak.com', 'alerts@kotak.com', 'banking@kotak.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'kotak', 'e-statement'],
  },
  {
    name: 'IDFC FIRST Bank',
    senders: ['idfcfirst.com', 'noreply@idfcfirst.com', 'alerts@idfcfirst.com', 'banking@idfcfirst.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'idfc', 'e-statement'],
  },
  {
    name: 'IndusInd Bank',
    senders: ['indusind.com', 'noreply@indusind.com', 'alerts@indusind.com', 'banking@indusind.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'indusind', 'e-statement'],
  },
  {
    name: 'AU Small Finance Bank',
    senders: [
      'ausmallfinancebank.com',
      'noreply@ausmallfinancebank.com',
      'alerts@ausmallfinancebank.com',
    ],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'au', 'e-statement'],
  },
  {
    name: 'HSBC',
    senders: ['hsbc.com', 'noreply@hsbc.com', 'alerts@hsbc.com', 'banking@hsbc.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement', 'Credit Card Statement'],
    attachmentNamePatterns: ['statement', 'hsbc', 'e-statement'],
  },
  {
    name: 'Standard Chartered',
    senders: ['sc.com', 'noreply@sc.com', 'alerts@sc.com', 'banking@sc.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement', 'Credit Card Statement'],
    attachmentNamePatterns: ['statement', 'sc', 'e-statement'],
  },
  {
    name: 'Citi',
    senders: ['citi.com', 'noreply@citi.com', 'alerts@citi.com', 'banking@citi.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'citi', 'e-statement'],
  },
  {
    name: 'HSBC (India)',
    senders: ['hsbc.co.in', 'noreply@hsbc.co.in', 'alerts@hsbc.co.in'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement', 'Credit Card Statement'],
    attachmentNamePatterns: ['statement', 'hsbc', 'e-statement'],
  },
  {
    name: 'Yes Bank Credit Card',
    senders: ['yesbankcreditcard.com', 'noreply@yesbankcreditcard.com'],
    subjectPatterns: ['Statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'yes', 'e-statement'],
  },
  /*
  
  */
  {
    name: 'Credit Card Bank Statement',
    senders: ['ravishankar.pal@fortune4.in'],
    subjectPatterns: ['Credit Card Bank Statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'yes', 'e-statement'],
  },

  {
    name: 'Credit card statement',
    senders: ['test@gmail.com'],
    subjectPatterns: ['Credit card statement', 'statement', 'E-Statement', 'e-statement'],
    attachmentNamePatterns: ['statement', 'yes', 'e-statement'],
  },
]

/**
 * Return the active set of issuer patterns.
 *
 * Patterns can be overridden via the `GMAIL_ISSUER_PATTERNS` environment
 * variable (a JSON array of IssuerPattern objects). If the variable is
 * absent or invalid, the built-in `DEFAULT_ISSUER_PATTERNS` are returned.
 */
export const getIssuerPatterns = (): IssuerPattern[] => {
  const envPatterns = env.GMAIL_ISSUER_PATTERNS
  if (envPatterns) {
    try {
      const parsed = JSON.parse(envPatterns)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as IssuerPattern[]
      }
    } catch {
      // Fall through to defaults on parse error
    }
  }
  return DEFAULT_ISSUER_PATTERNS
}

/** Return the names of all configured issuers. */
export const getIssuerNames = (): string[] => {
  return getIssuerPatterns().map((p) => p.name)
}

/**
 * Match an email's `From` and `Subject` headers against the configured
 * issuer patterns.
 *
 * Returns the first matching issuer name, or `null` if no match is found.
 * Matching is case-insensitive substring for both senders and subject patterns.
 */
export const matchIssuer = (
  from: string,
  subject: string,
): { name: string; pattern: IssuerPattern } | null => {
  const fromLower = from.toLowerCase()
  const subjectLower = subject.toLowerCase()

  for (const pattern of getIssuerPatterns()) {
    const fromMatch = pattern.senders.some((s) => fromLower.includes(s.toLowerCase()))
    if (!fromMatch) continue

    const subjectMatch = pattern.subjectPatterns.some((s) =>
      subjectLower.includes(s.toLowerCase()),
    )
    if (subjectMatch) {
      return { name: pattern.name, pattern }
    }
  }

  return null
}
