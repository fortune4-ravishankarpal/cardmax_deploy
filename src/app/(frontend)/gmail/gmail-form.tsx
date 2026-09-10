'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
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
  const [error, setError] = useState(() => {
    if (typeof window === 'undefined') return ''
    const queryError = new URLSearchParams(window.location.search).get('error')
    return queryError ? decodeURIComponent(queryError) : ''
  })
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null)

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/users/gmail/status')
      const data = await res.json()
      setStatus(data)
    } catch {
      setError('Could not load your Gmail connection status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    fetch('/api/users/gmail/status')
      .then((res) => res.json())
      .then((data) => {
        if (active) setStatus(data)
      })
      .catch(() => {
        if (active) setError('Could not load your Gmail connection status.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

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
      void loadStatus()
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
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
      setConnecting(false)
    }
  }

  return (
    <div className="gmail-container">
      {/* Breadcrumb */}
      <div className="gmail-breadcrumb">
        <Link href="/profile" className="btn-back">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Profile
        </Link>
      </div>

      <div className="gmail-card">
        <div className="card-top-header">
          <div className="header-icon-box">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1>Gmail Statement Sync</h1>
          <p>
            Connect your Gmail so CardMax can securely discover your monthly credit card statements and optimize your rewards.
          </p>
        </div>

        {error && (
          <div className="gmail-alert error" role="alert">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="gmail-loading">
            <span className="loading-spinner" />
            <p>Loading Gmail connection status…</p>
          </div>
        ) : status?.connected ? (
          <div className="connected-view">
            <div className="status-banner">
              <div className="status-info">
                <span className="badge badge-active">
                  <span className="dot" />
                  Connected
                </span>
                <h2>{status.gmailAddress || 'Your Gmail Account'}</h2>
                {status.connectedAt && (
                  <span className="meta-text">
                    Active since {new Date(status.connectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>

            <div className="action-box">
              <button
                type="button"
                className="btn-sync"
                onClick={handleIngest}
                disabled={ingesting}
              >
                {ingesting ? (
                  <>
                    <span className="btn-spinner" />
                    Searching your Gmail…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Import Statements Now
                  </>
                )}
              </button>
              <span className="helper-text">
                CardMax performs a read-only scan for statement PDFs from supported Indian credit card issuers.
              </span>
            </div>

            {ingestResult && (
              <div className="ingest-results-card">
                {ingestResult.error ? (
                  <div className="results-error">{ingestResult.error}</div>
                ) : (
                  <>
                    <div className="results-summary">
                      {ingestResult.message || `Processed ${ingestResult.processed || 0} statement(s).`}
                    </div>
                    {ingestResult.results && ingestResult.results.length > 0 && (
                      <ul className="results-list">
                        {ingestResult.results.map((r, i) => (
                          <li key={i} className={`result-item ${r.status}`}>
                            <span className="result-status-tag">{r.status}</span>
                            <span className="result-filename">{r.filename}</span>
                            <span className="result-issuer">({r.issuer})</span>
                            {r.error && <span className="result-err"> — {r.error}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="disconnect-row">
              <button
                type="button"
                className="btn-disconnect"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect Gmail Account'}
              </button>
            </div>
          </div>
        ) : (
          <div className="disconnected-view">
            <p className="notice-lead">
              Before connecting, here is exactly what CardMax will and will not do with your Gmail:
            </p>

            {/* Required Permission */}
            <div className="consent-block required">
              <div className="block-header">
                <h3>Read-only Statement Discovery</h3>
                <span className="badge badge-required">Required</span>
              </div>
              <p>
                We search your mailbox strictly for emails with attached PDF credit card statements (HDFC, ICICI, Axis, SBI, Amex, etc.). We <strong>never</strong> read personal emails, and <strong>never</strong> send, modify, or delete anything in your mailbox.
              </p>
            </div>

            {/* Optional Permission */}
            <div className="consent-block optional">
              <div className="block-header">
                <h3>Store Derived Financial Summaries</h3>
                <span className="badge badge-optional">Optional</span>
              </div>
              <p>
                Save extracted statement metadata (billing cycle dates, statement amounts due) to track spending trends over time.
              </p>
              <div className="checkbox-row">
                <input
                  id="persistDerived"
                  type="checkbox"
                  checked={persistDerived}
                  onChange={(e) => setPersistDerived(e.target.checked)}
                />
                <label htmlFor="persistDerived" className="checkbox-label">
                  Save statement financial summaries in my CardMax account
                </label>
              </div>
            </div>

            <p className="privacy-assurance">
              You can disconnect your Gmail account and revoke access at any time from your Privacy & Consent Settings.
            </p>

            <button
              type="button"
              className="btn-google-connect"
              onClick={handleConnect}
              disabled={connecting}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {connecting ? 'Connecting to Google…' : 'Confirm & Connect with Google'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
