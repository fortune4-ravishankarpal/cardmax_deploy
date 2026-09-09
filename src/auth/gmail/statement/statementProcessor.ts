import type { StatementContext, StatementClassification, IssuerDetectionResult, GenericCreditCardStatement } from './types'
import { extractPdfText } from './extractors/pdfTextExtractor'
import { classifyStatement } from './classifier/statementClassifier'
import { detectIssuer } from './classifier/issuerDetector'
import { genericStatementParser } from './parsers/genericStatementParser'
import { StatementLogger } from './statementLogger'

export interface ProcessedStatementResult {
  isStatement: boolean
  classification: StatementClassification
  issuerDetection: IssuerDetectionResult
  parsedData: GenericCreditCardStatement | null
  rawText: string
}

/**
 * High-level processor coordinating PDF extraction, statement classification,
 * issuer detection, and parser dispatch.
 */
export async function processStatementPdf(
  pdfBuffer: Buffer,
  context: StatementContext,
  threshold?: number,
): Promise<ProcessedStatementResult> {
  // 1. Deterministic text extraction
  const extraction = await extractPdfText(pdfBuffer)
  const pdfText = extraction.text || ''

  // 2. Classify whether this document is a credit-card statement
  const classification = classifyStatement(pdfText, context, threshold)
  StatementLogger.logClassification(context.attachmentFilename, classification)

  // 3. If not a statement, exit early
  if (!classification.isStatement) {
    return {
      isStatement: false,
      classification,
      issuerDetection: { issuer: null, confidence: 0, matchedSignals: [] },
      parsedData: null,
      rawText: pdfText,
    }
  }

  // 4. Decoupled issuer detection
  const issuerDetection = detectIssuer(pdfText, context)
  StatementLogger.logIssuerDetection(issuerDetection)

  // 5. Parser selection (Bank-specific or Generic fallback)
  if (issuerDetection.issuer) {
    StatementLogger.logProcessor(`${issuerDetection.issuer} parser`)
  } else {
    StatementLogger.logProcessor('generic statement parser')
  }

  // Parse extracted text
  const parsedData = genericStatementParser.parse(pdfText, issuerDetection.issuer)

  return {
    isStatement: true,
    classification,
    issuerDetection,
    parsedData,
    rawText: pdfText,
  }
}
