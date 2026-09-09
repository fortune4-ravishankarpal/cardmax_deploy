import { getIssuerPatterns } from '@/auth/gmail/issuers'
import type { IssuerDetectionResult, StatementContext } from '../types'

/**
 * Common bank brand aliases and keyword mappings for Indian and international issuers.
 */
const ISSUER_BRAND_ALIASES: Record<string, string[]> = {
  'HDFC Bank': ['hdfc bank', 'hdfcbank', 'hdfc'],
  'SBI Card': ['sbi card', 'sbicard', 'state bank of india', 'sbi credit card'],
  'ICICI Bank': ['icici bank', 'icicibank', 'icici credit card'],
  'Axis Bank': ['axis bank', 'axisbank'],
  'American Express': ['american express', 'amex'],
  'RBL Bank': ['rbl bank', 'rblbank', 'ratnakar bank'],
  'YES Bank': ['yes bank', 'yesbank'],
  'Federal Bank': ['federal bank', 'federalbank'],
  'Kotak Mahindra': ['kotak mahindra', 'kotak bank', 'kotak'],
  'IDFC FIRST Bank': ['idfc first', 'idfc bank', 'idfc'],
  'IndusInd Bank': ['indusind bank', 'indusind'],
  'AU Small Finance Bank': ['au small finance', 'au bank', 'aubank'],
  'HSBC': ['hsbc bank', 'hsbc india', 'hsbc'],
  'Standard Chartered': ['standard chartered', 'stan chart', 'sc.com'],
  'Citi': ['citibank', 'citi bank', 'citi card'],
}

/**
 * Rule-based issuer detector.
 * Decoupled from statement detection. Inspects PDF content, email subject, and sender.
 * Strongly prioritizes PDF content over sender headers.
 */
export function detectIssuer(
  pdfText: string,
  context: StatementContext,
): IssuerDetectionResult {
  const textLower = (pdfText || '').toLowerCase()
  const subjectLower = (context.subject || '').toLowerCase()
  const senderLower = (context.sender || '').toLowerCase()

  const patterns = getIssuerPatterns()
  let bestIssuer: string | null = null
  let highestScore = 0
  const signals: string[] = []

  for (const pattern of patterns) {
    let score = 0
    const currentSignals: string[] = []
    const issuerName = pattern.name

    // 1. PDF Content Check (Highest Priority)
    // Ignore generic non-brand phrases (e.g. "Credit card statement") from matching as a bank name in PDF body
    const isGenericPhrase =
      issuerName.toLowerCase().includes('statement') &&
      !ISSUER_BRAND_ALIASES[issuerName]

    const aliases = ISSUER_BRAND_ALIASES[issuerName] || [issuerName.toLowerCase()]
    const nameMatchInPdf = !isGenericPhrase && aliases.some((alias) => textLower.includes(alias.toLowerCase()))

    if (nameMatchInPdf) {
      score += 0.60
      currentSignals.push(`"${issuerName}" found in PDF content`)
    }

    // 2. Sender Domain / Address Check
    const senderMatched = pattern.senders.some((s) => senderLower.includes(s.toLowerCase()))
    if (senderMatched) {
      score += 0.30
      currentSignals.push(`Sender matches configured domain for ${issuerName}`)
    }

    // 3. Email Subject Check
    const subjectMatched =
      aliases.some((alias) => subjectLower.includes(alias.toLowerCase())) ||
      pattern.subjectPatterns.some(
        (sp) =>
          subjectLower.includes(sp.toLowerCase()) &&
          subjectLower.includes(issuerName.toLowerCase().split(' ')[0]),
      )

    if (subjectMatched) {
      score += 0.20
      currentSignals.push(`Subject mentions "${issuerName}"`)
    }

    if (score > highestScore) {
      highestScore = score
      bestIssuer = issuerName
      signals.splice(0, signals.length, ...currentSignals)
    }
  }

  // Fallback check: check alias dictionary directly in case custom patterns differ
  if (!bestIssuer || highestScore < 0.5) {
    for (const [canonicalName, aliases] of Object.entries(ISSUER_BRAND_ALIASES)) {
      const foundInPdf = aliases.some((alias) => textLower.includes(alias.toLowerCase()))
      if (foundInPdf) {
        bestIssuer = canonicalName
        highestScore = Math.max(highestScore, 0.75)
        signals.push(`"${canonicalName}" identified from PDF text aliases`)
        break
      }
    }
  }

  if (!bestIssuer || highestScore < 0.50) {
    return {
      issuer: null,
      confidence: 0,
      matchedSignals: [],
    }
  }

  const confidence = Math.min(0.99, Math.round(highestScore * 100) / 100)

  return {
    issuer: bestIssuer,
    confidence,
    matchedSignals: signals,
  }
}
