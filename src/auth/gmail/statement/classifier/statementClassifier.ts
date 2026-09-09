import type { StatementClassification, StatementContext } from '../types'

/**
 * Configurable detection threshold. Documents scoring >= this value are
 * classified as credit card statements.
 */
export const STATEMENT_DETECTION_THRESHOLD = 0.60

/** Weights for each signal category (must sum to 1.0) */
export const SIGNAL_WEIGHTS = {
  pdfContent: 0.60,
  emailSubject: 0.20,
  senderDomain: 0.10,
  attachmentFilename: 0.10,
}

/**
 * High-value credit card statement terms in PDF text.
 * Each matched term contributes to the PDF score.
 */
const HIGH_VALUE_PDF_TERMS = [
  'credit card',
  'credit-card',
  'payment due date',
  'minimum amount due',
  'total amount due',
  'statement date',
  'statement period',
  'card number',
  'credit limit',
  'available credit limit',
  'previous balance',
  'opening balance',
  'closing balance',
  'current balance',
  'transaction details',
  'transaction date',
  'amount due',
]

/**
 * Secondary/supporting statement terms in PDF text.
 */
const SECONDARY_PDF_TERMS = [
  'purchases',
  'payments',
  'credits',
  'cash limit',
  'finance charges',
  'late payment fee',
  'reward points',
  'interest charges',
  'billing cycle',
  'annual percentage rate',
  'overlimit',
]

/**
 * Negative terms indicating an invoice, e-commerce order, or general receipt
 * rather than a credit card statement.
 */
const NON_STATEMENT_INDICATORS = [
  'tax invoice',
  'shipping address',
  'delivery address',
  'order summary',
  'bill to:',
  'hsn code',
  'unit price',
  'item description',
  'tracking number',
]

const SUBJECT_STATEMENT_PATTERNS = [
  'credit card statement',
  'credit-card statement',
  'card statement',
  'e-statement',
  'e statement',
  'monthly statement',
  'account statement',
  'card e-statement',
  'statement of account',
  'statement',
]

const FILENAME_STATEMENT_PATTERNS = [
  'creditcard',
  'credit-card',
  'credit_card',
  'card_statement',
  'e-statement',
  'e_statement',
  'monthly_statement',
  'statement',
]

const SENDER_STATEMENT_PATTERNS = [
  'statement',
  'estatement',
  'cards',
  'creditcard',
  'billing',
  'alerts',
  'noreply',
]

/**
 * Rule-based classifier for detecting credit card statements.
 * Evaluates signals across PDF content, email subject, sender, and attachment filename.
 */
export function classifyStatement(
  pdfText: string,
  context: StatementContext,
  threshold = STATEMENT_DETECTION_THRESHOLD,
): StatementClassification {
  const signals: string[] = []
  const textLower = (pdfText || '').toLowerCase()
  const subjectLower = (context.subject || '').toLowerCase()
  const senderLower = (context.sender || '').toLowerCase()
  const filenameLower = (context.attachmentFilename || '').toLowerCase()

  // -------------------------------------------------------------
  // 1. PDF Content Score (Weight: 0.50)
  // -------------------------------------------------------------
  let pdfMatchedHighCount = 0
  for (const term of HIGH_VALUE_PDF_TERMS) {
    if (textLower.includes(term)) {
      pdfMatchedHighCount++
      signals.push(`PDF content: "${term}"`)
    }
  }

  let pdfMatchedSecondaryCount = 0
  for (const term of SECONDARY_PDF_TERMS) {
    if (textLower.includes(term)) {
      pdfMatchedSecondaryCount++
      signals.push(`PDF secondary: "${term}"`)
    }
  }

  // Check for negative/invoice indicators
  let negativeMatches = 0
  for (const neg of NON_STATEMENT_INDICATORS) {
    if (textLower.includes(neg)) {
      negativeMatches++
    }
  }

  // Calculate raw PDF score [0.0 to 1.0]
  // Having 3+ high-value terms (or 2 high + 2 secondary) yields high confidence
  let rawPdfScore = 0
  if (pdfMatchedHighCount >= 4) {
    rawPdfScore = 1.0
  } else if (pdfMatchedHighCount === 3) {
    rawPdfScore = 0.85
  } else if (pdfMatchedHighCount === 2) {
    rawPdfScore = pdfMatchedSecondaryCount >= 2 ? 0.75 : 0.55
  } else if (pdfMatchedHighCount === 1) {
    rawPdfScore = pdfMatchedSecondaryCount >= 3 ? 0.45 : 0.25
  } else if (pdfMatchedSecondaryCount >= 4) {
    rawPdfScore = 0.35
  }

  // Strong negative indicator suppression:
  // If invoice terms exist and credit card signals are weak, penalize heavily
  if (negativeMatches > 0 && pdfMatchedHighCount < 3) {
    const penalty = Math.min(0.8, negativeMatches * 0.3)
    rawPdfScore = Math.max(0, rawPdfScore - penalty)
    signals.push(`Penalty: non-statement invoice indicators found (${negativeMatches})`)
  }

  // -------------------------------------------------------------
  // 2. Email Subject Score (Weight: 0.25)
  // -------------------------------------------------------------
  let rawSubjectScore = 0
  if (subjectLower.includes('credit card statement') || subjectLower.includes('credit-card statement')) {
    rawSubjectScore = 1.0
    signals.push('Subject: "credit card statement"')
  } else if (
    subjectLower.includes('e-statement') ||
    subjectLower.includes('card statement') ||
    subjectLower.includes('monthly statement')
  ) {
    rawSubjectScore = 0.8
    signals.push('Subject: statement keyword')
  } else {
    for (const pat of SUBJECT_STATEMENT_PATTERNS) {
      if (subjectLower.includes(pat)) {
        rawSubjectScore = 0.5
        signals.push(`Subject: "${pat}"`)
        break
      }
    }
  }

  // -------------------------------------------------------------
  // 3. Sender / Domain Score (Weight: 0.15)
  // -------------------------------------------------------------
  let rawSenderScore = 0
  // Check if sender looks like a card/statement service or known banking domain
  for (const pat of SENDER_STATEMENT_PATTERNS) {
    if (senderLower.includes(pat)) {
      rawSenderScore = 0.7
      signals.push(`Sender: contains "${pat}"`)
      break
    }
  }
  if (senderLower.includes('bank') || senderLower.includes('card')) {
    rawSenderScore = Math.max(rawSenderScore, 0.8)
    signals.push('Sender: banking/card domain')
  }

  // -------------------------------------------------------------
  // 4. Attachment Filename Score (Weight: 0.10)
  // -------------------------------------------------------------
  let rawFilenameScore = 0
  for (const pat of FILENAME_STATEMENT_PATTERNS) {
    if (filenameLower.includes(pat)) {
      rawFilenameScore = pat.includes('credit') ? 1.0 : 0.7
      signals.push(`Filename: contains "${pat}"`)
      break
    }
  }

  // -------------------------------------------------------------
  // Weighted Combination
  // -------------------------------------------------------------
  let weightedScore =
    rawPdfScore * SIGNAL_WEIGHTS.pdfContent +
    rawSubjectScore * SIGNAL_WEIGHTS.emailSubject +
    rawSenderScore * SIGNAL_WEIGHTS.senderDomain +
    rawFilenameScore * SIGNAL_WEIGHTS.attachmentFilename

  // If PDF content alone provides overwhelming evidence (3+ primary credit-card fields),
  // ensure the overall confidence reflects this strong content match (Case C & Case E).
  if (rawPdfScore >= 0.85) {
    weightedScore = Math.max(weightedScore, rawPdfScore * 0.80)
  }

  // Round to 2 decimal places
  const finalConfidence = Math.min(1.0, Math.max(0.0, Math.round(weightedScore * 100) / 100))

  // Safety condition:
  // Filename alone should never decide a statement (Case F: misleading filename).
  // If PDF content was extracted and scored 0, but filename had 'statement', it must NOT pass.
  const hasSubstantiveContent = textLower.trim().length > 50
  const isStatement =
    hasSubstantiveContent && rawPdfScore === 0
      ? false // Explicitly reject documents with readable text that has 0 credit card signals
      : finalConfidence >= threshold

  return {
    isStatement,
    confidence: finalConfidence,
    score: finalConfidence,
    signals,
    breakdown: {
      pdfScore: rawPdfScore,
      senderScore: rawSenderScore,
      subjectScore: rawSubjectScore,
      filenameScore: rawFilenameScore,
    },
  }
}
