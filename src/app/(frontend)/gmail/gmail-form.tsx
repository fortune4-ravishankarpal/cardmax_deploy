'use client'

import { useCallback, useEffect, useState } from 'react'
import './gmail-consent.scss'

interface GmailStatus {
  connected: boolean
  gmailAddress?: string
  connectedAt?: string
  scopes?: string
}

interface IngestResult {
  ok?: boolean
  processed?: number
  totalFound?: number
  message?: string
  error?: string
  code?: string
  results?: Array<{
    issuer: string
    filename: string
    size: number
    status: 'parsed' | 'error'
    error?: string
  }>
}

export const GmailForm = () => {
  const [status, setStatus] = useState<GmailStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [ingesting, setIngesting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState('')
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null)

  const loadStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/users/gmail/status')
      const data = await res.json()
      setStatus(data)
    } catch {
      setError('Could not load your Gmail connection status.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const queryError = new URLSearchParams(window.location.search).get('error')
    if (queryError) setError(decodeURIComponent(queryError))
    loadStatus()
  }, [loadStatus])

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Gmail? CardMax will no longer be able to read your statements.')) {
      return
    }
    setDisconnecting(true)
    setError('')
    setIngestResult(null)
    try {
      const res = await fetch('/api/users/gmail/disconnect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Could not disconnect Gmail.')
      } else {
        setStatus({ connected: false })
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleIngest = async () => {
    setIngesting(true)
    setError('')
    setIngestResult(null)
    try {
      const res = await fetch('/api/users/gmail/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPdfs: 20 }),
      })
      const data: IngestResult = await res.json()
      setIngestResult(data)
      if (!res.ok) {
        setError(data.error || 'Ingestion failed.')
      }
      // Refresh status in case connection was dropped
      loadStatus(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIngesting(false)
    }
  }

  const [connecting, setConnecting] = useState(false)
  const [persistDerived, setPersistDerived] = useState(false)

  const handleConnect = async () => {
    setConnecting(true)
    setError('')
    try {
      const res = await fetch('/api/users/gmail/initiate-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persistDerived }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Could not initiate Gmail authorization. Please try again.')
        setConnecting(false)
        return
      }
      // Redirect to Google OAuth consent screen
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
      setConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="auth-card">
        <div className="auth-brand">
          <h1>Gmail statements</h1>
          <p>Loading your connection status…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-card">
      <div className="auth-brand">
        <h1>Gmail statements</h1>
        <p>Connect your Gmail so CardMax can find your credit card statements.</p>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {status?.connected ? (
        <>
          <div className="auth-connected">
            <p>
              Connected as <strong>{status.gmailAddress || 'your Gmail address'}</strong>.
            </p>
            {status.connectedAt && (
              <p className="auth-copy">Connected {new Date(status.connectedAt).toLocaleDateString()}</p>
            )}
          </div>

          <button
            type="button"
            className="auth-button auth-button--primary"
            onClick={handleIngest}
            disabled={ingesting}
          >
            {ingesting ? 'Searching your Gmail…' : 'Import my statements'}
          </button>

          <p className="auth-copy">
            CardMax scans for credit card statement PDFs from supported issuers using
            read-only access. You can run an import any time.
          </p>

          {ingestResult && (
            <div className="auth-consent">
              {ingestResult.error ? (
                <p className="auth-error" role="alert">
                  {ingestResult.error}
                </p>
              ) : (
                <>
                  <p>
                    {ingestResult.message || `Processed ${ingestResult.processed || 0} statement(s).`}
                  </p>
                  {ingestResult.results && ingestResult.results.length > 0 && (
                    <ul className="auth-list">
                      {ingestResult.results.map((r, i) => (
                        <li key={i}>
                          [{r.status}] {r.filename} — {r.issuer}
                          {r.error ? ` (${r.error})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          <button
            type="button"
            className="auth-button--link"
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect Gmail'}
          </button>
        </>
      ) : (
        <div className="gmail-consent-container">
          <p className="auth-copy" style={{ marginBottom: 0 }}>
            Before connecting, here is exactly what CardMax will and will not do with your Gmail:
          </p>

          {/* ── Required: Search inbox ── */}
          <div className="consent-section required">
            <div className="section-header">
              <h3>Read-only statement search</h3>
              <span className="badge required-badge">Required</span>
            </div>
            <p>
              We search your Gmail for emails from credit card issuers (such as HDFC, ICICI, Axis, SBI)
              and download attached PDF statements. We <strong>never</strong> read personal emails,
              and <strong>never</strong> send, modify, or delete anything in your mailbox.
            </p>
          </div>

          {/* ── Optional: Save summaries ── */}
          <div className="consent-section optional">
            <div className="section-header">
              <h3>Store financial summaries</h3>
              <span className="badge optional-badge">Optional</span>
            </div>
            <p>
              Save extracted statement data (billing periods, total due amounts, and transaction counts)
              so you can track your spending history across cards over time.
            </p>
            <div className="toggle-row">
              <input
                id="persistDerived"
                type="checkbox"
                checked={persistDerived}
                onChange={(e) => setPersistDerived(e.target.checked)}
              />
              <div>
                <label htmlFor="persistDerived" className="toggle-label">
                  Save financial summaries in my account
                </label>
                <p className="toggle-desc">
                  If off, statements are analyzed in-session only and derived summaries are not saved.
                  You can update this any time in Settings.
                </p>
              </div>
            </div>
          </div>

          <p className="consent-notice">
            You can disconnect Gmail and revoke permissions at any time from your Privacy & Consent Settings.
          </p>

          <button
            type="button"
            className="auth-button auth-button--primary"
            onClick={handleConnect}
            disabled={connecting}
            style={{ width: '100%' }}
          >
            <span className="auth-google-icon" aria-hidden="true" style={{ marginRight: '0.5rem' }}>
              G
            </span>
            {connecting ? 'Connecting to Google…' : 'Confirm & Connect with Google'}
          </button>
        </div>
      )}
    </div>
  )
}
