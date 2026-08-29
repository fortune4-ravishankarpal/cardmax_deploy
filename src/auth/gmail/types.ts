/**
 * Types for CardMax Gmail statement ingestion.
 *
 * These interfaces describe the data structures used throughout the
 * Gmail OAuth flow, token storage, API client, and statement parser.
 */

/** Raw tokens returned by Google's OAuth 2.0 token endpoint. */
export interface GmailTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number // Unix timestamp in milliseconds
  scope: string
  tokenType: string
}

/** A PDF attachment discovered in a Gmail message. */
export interface GmailAttachmentInfo {
  /** The Gmail message ID that contains the attachment. */
  messageId: string
  /**
   * The Gmail attachment ID used to download the attachment.
   * The special value `'inline'` means the data is already present
   * in the message payload (part.body.data) and no separate download is needed.
   */
  attachmentId: string
  filename: string
  mimeType: string
  size: number
  /** Base64url-encoded content, present for small (< 2 MB) attachments. */
  inlineData?: string
}

/** Parsed headers from a Gmail message. */
export interface GmailMessageHeaders {
  id: string
  threadId: string
  from?: string
  subject?: string
  date?: string
  internalDate?: string
}

/** The connection status of a user's Gmail integration. */
export type GmailConnectionStatus = 'active' | 'revoked' | 'expired'

/**
 * A pattern that identifies credit-card statement emails from a specific issuer.
 * Senders and subjectPatterns are matched as case-insensitive substrings against
 * the email's `From` header and `Subject` header respectively.
 */
export interface IssuerPattern {
  name: string
  /** Sender email addresses or domains (matched as substring in the From header). */
  senders: string[]
  /** Keywords that must appear in the email subject (case-insensitive substring match). */
  subjectPatterns: string[]
  /** Optional filename patterns for PDF attachments (case-insensitive substring match). */
  attachmentNamePatterns?: string[]
}

/** A single transaction extracted from a credit-card statement. */
export interface ParseTransaction {
  date: string
  description: string
  amount: number
  category?: string
}

/** The result of parsing a credit-card statement PDF. */
export interface ParseResult {
  issuer: string
  accountLast4: string
  periodStart: string
  periodEnd: string
  transactionCount: number
  totalAmount: number
  transactions: ParseTransaction[]
}

/** Context passed to the statement parser when ingesting a PDF. */
export interface ParseContext {
  userId: number
  issuer?: string
  source: 'gmail'
  gmailMessageId?: string
  attachmentFilename?: string
}

/**
 * Abstraction over the statement parser / reconciliation pipeline.
 *
 * Implementations may either:
 * - Call an external HTTP engine (e.g. the FastAPI CardMax engine) when
 *   `STATEMENT_PARSER_ENDPOINT` is configured.
 * - Fall back to a local implementation that persists the PDF and marks
 *   the statement as `pending` for later processing.
 */
export interface StatementParser {
  parse(
    userId: number,
    pdf: Buffer,
    context: Omit<ParseContext, 'userId'>,
  ): Promise<ParseResult | null>
}
