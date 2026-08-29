import { env } from '@/lib/env'
import type { Payload } from 'payload'
import { AuthorizationError } from '@/auth/services/otpService'
import type { ParseContext, ParseResult, StatementParser } from '@/auth/gmail/types'

/**
 * HTTP-backed statement parser.
 *
 * Sends the PDF buffer to the external CardMax FastAPI engine via
 * a `multipart/form-data` POST request to `{STATEMENT_PARSER_ENDPOINT}/parse`.
 *
 * The engine is expected to return a `ParseResult` JSON object containing
 * extracted transactions and reconciliation totals.
 */
export class HttpStatementParser implements StatementParser {
  constructor(private payload: Payload) {}

  async parse(
    _userId: number,
    pdf: Buffer,
    context: Omit<ParseContext, 'userId'>,
  ): Promise<ParseResult | null> {
    const endpoint = env.STATEMENT_PARSER_ENDPOINT
    if (!endpoint) {
      throw new AuthorizationError(
        'STATEMENT_PARSER_NOT_CONFIGURED',
        'No statement parser endpoint is configured.',
        501,
      )
    }

    const formData = new FormData()
    formData.append('file', new Blob([pdf], { type: 'application/pdf' }), context.attachmentFilename || 'statement.pdf')
    formData.append(
      'metadata',
      JSON.stringify({
        userId: _userId,
        issuer: context.issuer,
        source: context.source,
        gmailMessageId: context.gmailMessageId,
      }),
    )

    const response = await fetch(`${endpoint.replace(/\/+$/, '')}/parse`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const detail = (await response.text().catch(() => '')) || ''
      throw new AuthorizationError(
        'STATEMENT_PARSE_FAILED',
        `Parser service returned ${response.status}: ${detail}`,
        502,
      )
    }

    const result = (await response.json()) as ParseResult
    return result
  }
}

/**
 * Local statement parser.
 *
 * When no external parser endpoint is configured, this implementation
 * persists the PDF to the `media` collection and creates a `statements`
 * record with status `pending`. The actual transaction extraction is
 * deferred — a later cron or manual step can process these pending
 * statements.
 *
 * Returns `null` (no parsed result) because parsing is deferred.
 */
export class LocalStatementParser implements StatementParser {
  constructor(private payload: Payload) {}

  async parse(
    userId: number,
    pdf: Buffer,
    context: Omit<ParseContext, 'userId'>,
  ): Promise<ParseResult | null> {
    let mediaId: number | undefined
    try {
      const media = await this.payload.create({
        collection: 'media',
        data: {
          alt: `${context.issuer || 'statement'} ${context.attachmentFilename || 'unknown'}.pdf`,
        },
        file: {
          data: pdf,
          name: context.attachmentFilename || 'statement.pdf',
          mimetype: 'application/pdf',
          size: pdf.length,
        },
        overrideAccess: true,
      } as any)
      mediaId = media?.id
    } catch {
      // If media save fails, continue — we still record the statement
    }

    await this.payload.create({
      collection: 'statements',
      data: {
        user: userId,
        source: 'gmail',
        issuer: context.issuer || 'unknown',
        gmailMessageId: context.gmailMessageId,
        attachmentFilename: context.attachmentFilename,
        status: 'pending',
        pdf: mediaId,
        pdfSize: pdf.length,
      },
      overrideAccess: true,
    } as any)

    return null
  }
}

/**
 * Factory that returns the appropriate statement parser based on
 * configuration.
 */
export const getStatementParser = (payload: Payload): StatementParser => {
  if (env.STATEMENT_PARSER_ENDPOINT) {
    return new HttpStatementParser(payload)
  }
  return new LocalStatementParser(payload)
}
