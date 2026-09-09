import { AuthorizationError } from '@/auth/services/otpService'
import type { GmailAttachmentInfo } from '@/auth/gmail/types'
import { matchIssuer, getIssuerPatterns } from '@/auth/gmail/issuers'
import { GMAIL_API_BASE, GMAIL_SEARCH_MAX_RESULTS } from '@/auth/gmail/constants'

/** Raw response shape from `gmail.users.messages.list`. */
interface GmailListResponse {
  messages?: Array<{ id: string; threadId: string }>
  nextPageToken?: string
  resultSizeEstimate?: number
}

/** A single MIME part within a Gmail message payload. */
interface GmailPart {
  partId?: string
  filename?: string
  mimeType?: string
  body?: {
    attachmentId?: string
    data?: string
    size?: number
  }
  parts?: GmailPart[]
  headers?: Array<{ name: string; value: string }>
}

/** Full response shape from `gmail.users.messages.get?format=full`. */
export interface GmailMessageFull {
  id: string
  threadId: string
  labelIds?: string[]
  snippet?: string
  internalDate?: string
  payload?: {
    headers: Array<{ name: string; value: string }>
    parts?: GmailPart[]
    body?: {
      attachmentId?: string
      data?: string
      size?: number
    }
    mimeType?: string
  }
}

/**
 * Internal helper that performs an authenticated GET against the Gmail API
 * and throws an `AuthorizationError` for common failure modes.
 */
const gmailFetch = async (
  accessToken: string,
  path: string,
  query?: URLSearchParams,
): Promise<any> => {
  const url = `${GMAIL_API_BASE}/${path}${query ? `?${query.toString()}` : ''}`
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (response.status === 401) {
    throw new AuthorizationError('GMAIL_AUTH_FAILED', 'Gmail access token is invalid or expired.', 401)
  }
  if (response.status === 403) {
    throw new AuthorizationError('GMAIL_FORBIDDEN', 'Insufficient Gmail permissions.', 403)
  }
  if (response.status === 429) {
    throw new AuthorizationError(
      'GMAIL_RATE_LIMITED',
      'Gmail API rate limit exceeded. Please try again later.',
      429,
    )
  }
  if (!response.ok) {
    throw new AuthorizationError(
      'GMAIL_API_ERROR',
      `Gmail API error: ${response.statusText || response.status}`,
      response.status,
    )
  }

  return response.json()
}

/** Convert base64url to standard base64 for Buffer.from compatibility. */
const base64UrlToBase64 = (base64url: string): string => {
  return base64url.replace(/-/g, '+').replace(/_/g, '/')
}

/**
 * Extract headers from a Gmail message payload into a flat record.
 * Header names are lowercased.
 */
export const extractMessageHeaders = (
  headers: Array<{ name: string; value: string }>,
): Record<string, string> => {
  const result: Record<string, string> = {}
  for (const h of headers || []) {
    result[h.name.toLowerCase()] = h.value
  }
    return result
}

/**
 * Build a Gmail search query for a given issuer pattern.
 *
 * Example:
 *   (from:hdfcbank.com OR from:statement@hdfcbank.com) ("Statement" OR "statement") has:attachment filename:pdf
 */
export const buildGmailQuery = (senders: string[], subjectPatterns: string[]): string => {
  const senderQuery = senders.map((s) => `from:${s}`).join(' OR ')
  const subjectQuery = subjectPatterns.map((s) => `"${s}"`).join(' OR ')
  return `(${senderQuery}) (${subjectQuery}) has:attachment filename:pdf`
}

/**
 * Build a generic Gmail search query that finds credit-card statement PDFs
 * regardless of issuer or sender.
 */
export const buildGenericStatementQuery = (): string => {
  return 'has:attachment filename:pdf (statement OR "e-statement" OR "e_statement" OR "credit card" OR "card statement" OR "account statement" OR "monthly statement")'
}

/** Recursively search MIME parts for PDF attachments. */
const findPdfParts = (part: GmailPart, messageId: string): GmailAttachmentInfo[] => {
  const results: GmailAttachmentInfo[] = []

  const partFilename = part.filename || ''
  const partMimetype = part.mimeType || ''
  const isPdf =
    partMimetype.toLowerCase().includes('pdf') ||
    partFilename.toLowerCase().endsWith('.pdf')

  if (isPdf && partFilename) {
    results.push({
      messageId,
      attachmentId: part.body?.attachmentId || 'inline',
      filename: partFilename,
      mimeType: partMimetype || 'application/pdf',
      size: part.body?.size || 0,
      inlineData: part.body?.data,
    })
  } else if (part.parts) {
    // Recurse into sub-parts to find nested attachments
    for (const sub of part.parts) {
      results.push(...findPdfParts(sub, messageId))
    }
  }

  return results
}

/** Extract all PDF attachments from a Gmail message. */
export const extractPdfAttachments = (
  message: GmailMessageFull,
): GmailAttachmentInfo[] => {
  const results: GmailAttachmentInfo[] = []

  if (message.payload?.parts) {
    for (const part of message.payload.parts) {
      results.push(...findPdfParts(part, message.id))
    }
  }

  // Single-part message with inline PDF data
  if (message.payload?.body?.data && !message.payload.parts) {
    const isPdf = message.payload.mimeType?.toLowerCase().includes('pdf')
    if (isPdf) {
      results.push({
        messageId: message.id,
        attachmentId: 'inline',
        filename: 'message.pdf',
        mimeType: message.payload.mimeType || 'application/pdf',
        size: message.payload.body.size || 0,
        inlineData: message.payload.body.data,
      })
    }
  }

  return results
}

/**
 * Retrieve a single Gmail message with `format=full` so that
 * attachment metadata and inline data are included.
 */
export const getMessage = async (
  accessToken: string,
  messageId: string,
): Promise<GmailMessageFull> => {
  const params = new URLSearchParams({ format: 'full' })
  return gmailFetch(accessToken, `me/messages/${messageId}`, params)
}

/**
 * Download the raw PDF content of a Gmail attachment.
 *
 * For small attachments (< 2 MB) the data is embedded inline in
 * the message payload; otherwise the attachment is fetched from
 * the `messages.attachments.get` endpoint.
 */
export const downloadAttachment = async (
  accessToken: string,
  attachment: GmailAttachmentInfo,
): Promise<Buffer> => {
  if (attachment.inlineData) {
    return Buffer.from(base64UrlToBase64(attachment.inlineData), 'base64')
  }

  const data = (await gmailFetch(
    accessToken,
    `me/messages/${attachment.messageId}/attachments/${attachment.attachmentId}`,
  )) as { data: string }
  return Buffer.from(base64UrlToBase64(data.data), 'base64')
}

/**
 * Search Gmail for credit-card statement PDFs across all configured
 * issuer patterns.
 *
 * Iterates through each issuer pattern, building a Gmail search query
 * that matches the issuer's sender/subject pattern and requires PDF
 * attachments. Returns metadata for each discovered attachment.
 *
 * @param accessToken  Valid OAuth 2.0 access token with gmail.readonly scope.
 * @param maxResults   Maximum number of attachments to return.
 */
export const searchGmailStatements = async (
  accessToken: string,
  maxResults: number = GMAIL_SEARCH_MAX_RESULTS,
): Promise<GmailAttachmentInfo[]> => {
  const attachments: GmailAttachmentInfo[] = []
  const seenMessageIds = new Set<string>()

  // 1. Broad generic statement search (finds statements regardless of issuer/sender)
  const genericQuery = buildGenericStatementQuery()
  const queries: string[] = [genericQuery]

  // 2. Also append configured issuer queries to catch any bank with non-standard subject lines
  const patterns = getIssuerPatterns()
  for (const issuer of patterns) {
    queries.push(buildGmailQuery(issuer.senders, issuer.subjectPatterns))
  }

  for (const query of queries) {
    if (attachments.length >= maxResults) break

    let pageToken: string | undefined

    do {
      const params = new URLSearchParams({
        q: query,
        maxResults: String(Math.min(maxResults - attachments.length, 100)),
      })
      if (pageToken) params.set('pageToken', pageToken)

      let list: GmailListResponse
      try {
        list = await gmailFetch(accessToken, 'me/messages', params)
      } catch {
        break
      }
      const messages = list.messages || []

      for (const msg of messages) {
        if (attachments.length >= maxResults) break
        if (seenMessageIds.has(msg.id)) continue
        seenMessageIds.add(msg.id)

        try {
          const message = await getMessage(accessToken, msg.id)
          const pdfs = extractPdfAttachments(message)
          for (const pdf of pdfs) {
            if (attachments.length >= maxResults) break
            attachments.push(pdf)
          }
        } catch {
          // Skip messages that fail to fetch — don't abort the entire search
        }
      }

      pageToken = list.nextPageToken
    } while (pageToken && attachments.length < maxResults)
  }

  return attachments
}

/**
 * Given a Gmail message, extract the From and Subject headers and
 * attempt to match them against known issuer patterns.
 *
 * Returns the matched issuer name (or `null`).
 */
export const identifyIssuerFromMessage = (
  message: GmailMessageFull,
): { name: string } | null => {
  if (!message.payload?.headers) return null
  const headers = extractMessageHeaders(message.payload.headers)
  const from = headers['from'] || ''
  const subject = headers['subject'] || ''
  const match = matchIssuer(from, subject)
  return match ? { name: match.name } : null
}

