import type { ParseTransaction } from '@/auth/gmail/types'

/**
 * Result of the deterministic statement classification.
 */
export interface StatementClassification {
  isStatement: boolean
  confidence: number
  signals: string[]
  score?: number
  breakdown?: {
    pdfScore: number
    senderScore: number
    subjectScore: number
    filenameScore: number
  }
}

/**
 * Result of issuer identification across PDF text, sender, and subject.
 */
export interface IssuerDetectionResult {
  issuer: string | null
  confidence: number
  matchedSignals: string[]
}

/**
 * Generic credit card statement extracted by rule-based heuristic parsing.
 * All fields are optional to handle varying statement layouts.
 */
export interface GenericCreditCardStatement {
  issuer?: string
  cardLast4?: string
  statementDate?: string
  statementPeriodStart?: string
  statementPeriodEnd?: string
  paymentDueDate?: string
  previousBalance?: number
  payments?: number
  purchases?: number
  fees?: number
  interest?: number
  totalAmountDue?: number
  minimumAmountDue?: number
  transactions: ParseTransaction[]
}

/**
 * Context metadata about the email and attachment.
 */
export interface StatementContext {
  sender: string
  subject: string
  attachmentFilename: string
  messageId?: string
}
