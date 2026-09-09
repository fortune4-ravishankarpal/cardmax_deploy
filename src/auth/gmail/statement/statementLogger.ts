import type { StatementClassification, IssuerDetectionResult } from './types'

/**
 * Mask sensitive values (card numbers, emails, tokens) before logging.
 */
export function maskSensitive(val: string | number | undefined | null): string {
  if (!val) return ''
  const str = String(val).trim()

  // Mask card numbers (12-19 digits) to show only last 4
  const maskedCards = str.replace(/\b(?:\d[ -]*?){13,16}\b/g, (match) => {
    const digits = match.replace(/\D/g, '')
    return `************${digits.slice(-4)}`
  })

  // Mask email addresses (e.g., ravishankar.pal@fortune4.in -> r***l@fortune4.in)
  const maskedEmail = maskedCards.replace(
    /\b([a-zA-Z0-9_.+-])([a-zA-Z0-9_.+-]*?)([a-zA-Z0-9_.+-])?@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\b/g,
    (_, first, _middle, last, domain) => {
      return last ? `${first}***${last}@${domain}` : `${first}***@${domain}`
    },
  )

  return maskedEmail
}

/**
 * Structured logger for statement ingestion, classification, and parsing.
 */
export class StatementLogger {
  public static logClassification(filename: string, classification: StatementClassification): void {
    const lines = [
      `[StatementDetector] Attachment: ${maskSensitive(filename)}`,
      `[StatementDetector] Is Statement: ${classification.isStatement}`,
      `[StatementDetector] Statement confidence: ${classification.confidence.toFixed(2)}`,
    ]

    if (classification.signals.length > 0) {
      lines.push('[StatementDetector] Signals:')
      for (const s of classification.signals) {
        lines.push(`  - ${maskSensitive(s)}`)
      }
    }

    console.log(lines.join('\n'))
  }

  public static logIssuerDetection(result: IssuerDetectionResult): void {
    const lines = [
      `[IssuerDetector] Issuer: ${result.issuer || 'UNKNOWN'}`,
      `[IssuerDetector] Confidence: ${result.confidence.toFixed(2)}`,
    ]

    if (result.matchedSignals.length > 0) {
      lines.push('[IssuerDetector] Signals:')
      for (const s of result.matchedSignals) {
        lines.push(`  - ${maskSensitive(s)}`)
      }
    }

    console.log(lines.join('\n'))
  }

  public static logProcessor(parserType: string, details?: string): void {
    const detailStr = details ? ` (${maskSensitive(details)})` : ''
    console.log(`[StatementProcessor] Using ${parserType}${detailStr}`)
  }
}
