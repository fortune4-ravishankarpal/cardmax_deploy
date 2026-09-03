import type { PayloadRequest } from 'payload'
import { env } from '@/lib/env'
import { AuthorizationError } from '@/auth/services/otpService'
import {
  createGmailOAuthUrl,
  validateGmailState,
  exchangeGmailCode,
  refreshGmailAccessToken,
  revokeGmailToken,
  fetchGmailAddress,
} from '@/auth/gmail/oauth'
import {
  saveGmailTokens,
  loadGmailTokens,
  deleteGmailConnection,
  getGmailConnectionStatus,
} from '@/auth/gmail/tokens'
import {
  searchGmailStatements,
  getMessage,
  downloadAttachment,
  identifyIssuerFromMessage,
} from '@/auth/gmail/client'
import type { GmailMessageFull } from '@/auth/gmail/client'
import { getStatementParser } from '@/auth/gmail/parser'
import { GMAIL_INGEST_MAX_PDFS } from '@/auth/gmail/constants'

const json = (data: unknown, status = 200): Response => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const jsonBody = async (req: PayloadRequest): Promise<Record<string, unknown>> => {
  if (typeof req.json !== 'function') return {}
  try {
    return (await req.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

/** Require an authenticated `users` collection user. Returns the user or throws 401. */
const requireUser = (req: PayloadRequest): { id: number; email: string } => {
  if (!req.user || req.user.collection !== 'users') {
    throw new AuthorizationError('UNAUTHENTICATED', 'Authentication required.', 401)
  }
  return req.user as unknown as { id: number; email: string }
}

/** Check that Gmail OAuth is configured. Throws 501 if not. */
const requireGmailConfig = (): void => {
  if (!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET) {
    throw new AuthorizationError('GMAIL_DISABLED', 'Gmail integration is not configured.', 501)
  }
}

import { ConsentService } from '@/consent/service'
import { CURRENT_PRIVACY_VERSION } from '@/lib/consentVersions'

/**
 * GET /api/users/gmail/connect
 *
 * Legacy direct initiator for the Gmail OAuth 2.0 flow. Requires an authenticated user.
 * Creates a CSRF state nonce tied to the user, then redirects to Google's
 * consent screen requesting `gmail.readonly` scope.
 */
export const gmailConnectHandler = async (req: PayloadRequest): Promise<Response> => {
  try {
    requireGmailConfig()
    const user = requireUser(req)
    const { url } = createGmailOAuthUrl(user.id)
    return new Response(null, { status: 302, headers: { Location: url } })
  } catch (e) {
    const err = e as AuthorizationError
    return json({ error: err.message, code: err.code }, err.status || 500)
  }
}

/**
 * POST /api/users/gmail/initiate-consent
 *
 * Initiates the Gmail OAuth 2.0 flow with a server-side consent intent.
 * The client sends `{ persistDerived: boolean }`.
 * Creates an OAuth state nonce mapped to the user and their consent intent,
 * then returns the server-constructed OAuth redirect URL.
 */
export const gmailInitiateConsentHandler = async (req: PayloadRequest): Promise<Response> => {
  try {
    requireGmailConfig()
    const user = requireUser(req)
    const body = await jsonBody(req)
    const persistDerived = Boolean(body.persistDerived)

    const { url } = createGmailOAuthUrl(user.id, {
      persist_derived: persistDerived,
    })

    return json({ ok: true, url })
  } catch (e) {
    const err = e as AuthorizationError
    return json({ error: err.message, code: err.code }, err.status || 500)
  }
}

/**
 * GET /api/users/gmail/callback
 *
 * Handles the OAuth 2.0 callback from Google. Validates the CSRF state,
 * retrieves the server-stored consent intent, exchanges the authorization code for tokens,
 * stores the encrypted refresh token, finalizes the consent records, and redirects back.
 */
export const gmailCallbackHandler = async (req: PayloadRequest): Promise<Response> => {
  const url = new URL(req.url || '')
  const code = url.searchParams.get('code') || ''
  const state = url.searchParams.get('state') || ''
  const baseUrl = env.NEXT_PUBLIC_SERVER_URL

  if (!code) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${baseUrl}/gmail?error=${encodeURIComponent('Google sign-in was cancelled.')}` },
    })
  }

  try {
    requireGmailConfig()
    const user = requireUser(req)
    const consentIntent = validateGmailState(state, user.id)

    const tokens = await exchangeGmailCode(code)

    // Resolve the Gmail address from the access token
    let gmailAddress = await fetchGmailAddress(tokens.accessToken)

    await saveGmailTokens(req.payload, user.id, tokens, gmailAddress || '')

    // Finalize consent records server-side
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
    const userAgent = req.headers.get('user-agent') || undefined

    // 1. Mandatory Gmail purpose: analyse_inbox (granted upon successful OAuth)
    await ConsentService.grant({
      userId: user.id,
      purpose: 'analyse_inbox',
      version: CURRENT_PRIVACY_VERSION,
      source: 'gmail_connect_flow',
      ipAddress: ip,
      userAgent,
    })

    // 2. Optional Gmail secondary purpose: persist_derived
    if (consentIntent?.persist_derived) {
      await ConsentService.grant({
        userId: user.id,
        purpose: 'persist_derived',
        version: CURRENT_PRIVACY_VERSION,
        source: 'gmail_connect_flow',
        ipAddress: ip,
        userAgent,
      })
    } else {
      await ConsentService.revoke({
        userId: user.id,
        purpose: 'persist_derived',
        version: CURRENT_PRIVACY_VERSION,
        source: 'gmail_connect_flow',
        ipAddress: ip,
        userAgent,
      })
    }

    return new Response(null, {
      status: 302,
      headers: { Location: `${baseUrl}/gmail?connected=true` },
    })
  } catch (e) {
    const err = e as AuthorizationError
    const reason = encodeURIComponent(err.message || 'Gmail connection failed.')
    return new Response(null, {
      status: 302,
      headers: { Location: `${baseUrl}/gmail?error=${reason}` },
    })
  }
}

/**
 * GET /api/users/gmail/status
 *
 * Returns the current Gmail connection status for the authenticated user.
 * No sensitive token data is returned.
 */
export const gmailStatusHandler = async (req: PayloadRequest): Promise<Response> => {
  try {
    const user = requireUser(req)
    const status = await getGmailConnectionStatus(req.payload, user.id)
    return json(status)
  } catch (e) {
    const err = e as AuthorizationError
    return json({ error: err.message, code: err.code }, err.status || 500)
  }
}

/**
 * POST /api/users/gmail/disconnect
 *
 * Revokes the Gmail OAuth tokens at Google, deletes the local
 * connection record, and revokes active Gmail consent records.
 */
export const gmailDisconnectHandler = async (req: PayloadRequest): Promise<Response> => {
  try {
    const user = requireUser(req)

    try {
      const tokens = await loadGmailTokens(req.payload, user.id)
      await revokeGmailToken(tokens.refreshToken)
    } catch (e) {
      const err = e as AuthorizationError
      if (err.code !== 'GMAIL_NOT_CONNECTED') throw e
    }

    // Always attempt local cleanup (idempotent)
    await deleteGmailConnection(req.payload, user.id)

    // Revoke Gmail consent records
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined
    const userAgent = req.headers.get('user-agent') || undefined

    await ConsentService.revoke({
      userId: user.id,
      purpose: 'analyse_inbox',
      version: CURRENT_PRIVACY_VERSION,
      source: 'settings_page',
      ipAddress: ip,
      userAgent,
    }).catch(() => {})

    await ConsentService.revoke({
      userId: user.id,
      purpose: 'persist_derived',
      version: CURRENT_PRIVACY_VERSION,
      source: 'settings_page',
      ipAddress: ip,
      userAgent,
    }).catch(() => {})

    return json({ ok: true, disconnected: true })
  } catch (e) {
    const err = e as AuthorizationError
    return json({ error: err.message, code: err.code }, err.status || 500)
  }
}

/**
 * Result of processing a single PDF attachment during ingestion.
 */
interface IngestResultEntry {
  issuer: string
  filename: string
  size: number
  status: 'parsed' | 'error' | 'scanned_not_stored'
  error?: string
}

/**
 * POST /api/users/gmail/ingest
 *
 * Triggers a Gmail statement ingestion run for the authenticated user.
 *
 * Steps:
 * 1. Verify consent for analyse_inbox.
 * 2. Load + decrypt the stored refresh token.
 * 3. Refresh the access token if it has expired.
 * 4. Search Gmail for statement emails using issuer patterns.
 * 5. Download each PDF attachment.
 * 6. Identify the issuer from email headers.
 * 7. If persist_derived consent is active, pass PDF to statement parser pipeline.
 *
 * Accepts an optional `maxPdfs` body field to limit the number of
 * PDFs processed (default: GMAIL_INGEST_MAX_PDFS, max: GMAIL_INGEST_MAX_PDFS).
 */
export const gmailIngestHandler = async (req: PayloadRequest): Promise<Response> => {
  const body = await jsonBody(req)
  const maxPdfs = Math.min(
    Number(body.maxPdfs) || GMAIL_INGEST_MAX_PDFS,
    GMAIL_INGEST_MAX_PDFS,
  )

  try {
    const user = requireUser(req)

    // Check if user has active consent for analyse_inbox
    const canAnalyse = await ConsentService.hasConsent(user.id, 'analyse_inbox')
    if (!canAnalyse) {
      return json(
        { error: 'Consent to search Gmail for statements is not granted.', code: 'CONSENT_REQUIRED' },
        403,
      )
    }

    const canPersist = await ConsentService.hasConsent(user.id, 'persist_derived')

    const tokens = await loadGmailTokens(req.payload, user.id)

    // Refresh the access token (throws GMAIL_TOKEN_REFRESH_FAILED if invalid)
    let accessToken: string
    try {
      const refreshed = await refreshGmailAccessToken(tokens.refreshToken)
      accessToken = refreshed.accessToken
    } catch (e) {
      const err = e as AuthorizationError
      if (err.code === 'GMAIL_TOKEN_REFRESH_FAILED') {
        // The refresh token is invalid — clean up the connection
        await deleteGmailConnection(req.payload, user.id)
        return json(
          { error: 'Gmail connection expired. Please reconnect.', code: 'GMAIL_TOKEN_EXPIRED' },
          401,
        )
      }
      throw e
    }

    // Search Gmail for statement PDFs across all issuer patterns
    const attachments = await searchGmailStatements(accessToken, maxPdfs)

    if (attachments.length === 0) {
      return json({
        ok: true,
        processed: 0,
        results: [],
        message: 'No credit card statements found in your Gmail.',
      })
    }

    // Process each PDF through the statement parser pipeline
    const parser = getStatementParser(req.payload)
    const results: IngestResultEntry[] = []

    let processed = 0
    for (const att of attachments) {
      if (processed >= maxPdfs) break
      processed++

      try {
        const pdf = await downloadAttachment(accessToken, att)

        // Identify the issuer from the email headers
        let issuer = 'unknown'
        try {
          const message: GmailMessageFull = await getMessage(accessToken, att.messageId)
          const match = identifyIssuerFromMessage(message)
          if (match) issuer = match.name
        } catch {
          // Non-fatal — continue with 'unknown' issuer
        }

        // Pass the PDF to the statement parser pipeline only if persist_derived consent is active
        if (canPersist) {
          await parser.parse(user.id, pdf, {
            issuer,
            source: 'gmail',
            gmailMessageId: att.messageId,
            attachmentFilename: att.filename,
          })
        }

        results.push({
          issuer,
          filename: att.filename,
          size: pdf.length,
          status: canPersist ? 'parsed' : 'scanned_not_stored',
        })
      } catch (e) {
        const err = e as Error
        results.push({
          issuer: 'unknown',
          filename: att.filename,
          size: 0,
          status: 'error',
          error: err.message,
        })
      }
    }

    return json({
      ok: true,
      processed,
      totalFound: attachments.length,
      results,
      message: canPersist
        ? `Processed ${processed} statement PDF(s).`
        : `Scanned ${processed} statement PDF(s) (derived storage disabled per privacy setting).`,
    })
  } catch (e) {
    const err = e as AuthorizationError
    return json({ error: err.message, code: err.code }, err.status || 500)
  }
}
