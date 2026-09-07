'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import './styles.scss'

interface ConsentSummary {
  consents: {
    analyse_inbox: 'granted' | 'revoked' | 'not_set'
    persist_derived: 'granted' | 'revoked' | 'not_set'
  }
  marketing: boolean
  gmailConnected: boolean
  gmailAddress?: string
  gmailConnectedAt?: string
  legalVersions: {
    tosVersion: string | null
    acceptedTermsAt: string | null
    privacyNoticeVersion: string | null
    acknowledgedPrivacyAt: string | null
  }
}

export default function ConsentPage() {
  const [summary, setSummary] = useState<ConsentSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/users/consent/summary')
      if (res.status === 401) {
        window.location.href = '/login'
        return
      }
      if (!res.ok) throw new Error('Could not load privacy settings.')
      const data = await res.json()
      setSummary(data)
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to load settings.', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  const handleConsentToggle = async (purpose: 'persist_derived', currentStatus: 'granted' | 'revoked' | 'not_set') => {
    const nextAction = currentStatus === 'granted' ? 'revoke' : 'grant'
    setUpdating(purpose)
    setMessage(null)

    try {
      const res = await fetch('/api/users/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: nextAction,
          purpose,
          source: 'settings_page',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update setting.')

      setSummary((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          consents: {
            ...prev.consents,
            [purpose]: nextAction === 'grant' ? 'granted' : 'revoked',
          },
        }
      })

      setMessage({
        text: nextAction === 'grant' ? 'Preference updated: enabled.' : 'Preference updated: disabled.',
        type: 'success',
      })
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update preference.', type: 'error' })
    } finally {
      setUpdating(null)
    }
  }

  const handleMarketingToggle = async () => {
    if (!summary) return
    const nextMarketing = !summary.marketing
    setUpdating('marketing')
    setMessage(null)

    try {
      const res = await fetch('/api/users/consent/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketing: nextMarketing }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update marketing preference.')

      setSummary((prev) => (prev ? { ...prev, marketing: nextMarketing } : prev))
      setMessage({
        text: nextMarketing ? 'Subscribed to product updates.' : 'Unsubscribed from product updates.',
        type: 'success',
      })
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update preference.', type: 'error' })
    } finally {
      setUpdating(null)
    }
  }

  const handleDisconnectGmail = async () => {
    if (!window.confirm('Disconnect Gmail? CardMax will stop searching your inbox and remove active statement permissions.')) {
      return
    }

    setUpdating('disconnect_gmail')
    setMessage(null)

    try {
      const res = await fetch('/api/users/gmail/disconnect', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not disconnect Gmail.')

      setSummary((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          gmailConnected: false,
          gmailAddress: undefined,
          consents: {
            ...prev.consents,
            analyse_inbox: 'revoked',
            persist_derived: 'revoked',
          },
        }
      })

      setMessage({ text: 'Gmail disconnected and statement permissions revoked.', type: 'success' })
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to disconnect Gmail.', type: 'error' })
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="consent-page-wrapper">
      <div className="consent-container">
        {/* Breadcrumb */}
        <div className="consent-breadcrumb">
          <Link href="/profile" className="btn-back">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Profile
          </Link>
        </div>

        {/* Header */}
        <header className="consent-header">
          <div className="header-text">
            <h1>Privacy & Data Consent</h1>
            <p>Control how CardMax processes, analyzes, and stores your financial metadata.</p>
          </div>
        </header>

        {/* Status Message */}
        {message && (
          <div className={`consent-alert ${message.type}`} role="alert">
            <div className="alert-content">
              <span className="alert-icon">
                {message.type === 'success' ? (
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </span>
              <span>{message.text}</span>
            </div>
            <button type="button" className="alert-close" onClick={() => setMessage(null)} aria-label="Dismiss">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="consent-loading">
            <span className="loading-spinner" />
            <p>Loading privacy settings…</p>
          </div>
        ) : (
          <div className="consent-sections-wrapper">
            {/* 1. Account & Core Service */}
            <section className="consent-card">
              <div className="card-header">
                <h2>Account & Core Service</h2>
                <p>Required services essential for account security and platform operations.</p>
              </div>

              <div className="consent-items-list">
                <div className="consent-row">
                  <div className="row-info">
                    <div className="row-title">
                      <h3>Identity & Account Profile</h3>
                      <span className="badge badge-required">Required</span>
                    </div>
                    <p>
                      Your name, verified email, and phone number are used to identify your account, secure your logins, and send security alerts.
                    </p>
                  </div>
                </div>

                <div className="consent-row">
                  <div className="row-info">
                    <div className="row-title">
                      <h3>Billing & Subscriptions</h3>
                      <span className="badge badge-required">Required</span>
                    </div>
                    <p>
                      Records of active tiers, invoices, and payment events necessary to administer your CardMax plan.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Gmail & Statement Data */}
            <section className="consent-card">
              <div className="card-header">
                <h2>Gmail Statement Digestion</h2>
                <p>Permissions regarding statement digestion and financial summary persistence.</p>
              </div>

              <div className="consent-items-list">
                {summary?.gmailConnected ? (
                  <>
                    <div className="consent-row">
                      <div className="row-info">
                        <div className="row-title">
                          <h3>Gmail Account Connection</h3>
                          <span className="badge badge-active">Connected</span>
                        </div>
                        <p>
                          Connected as <strong>{summary.gmailAddress}</strong>. CardMax holds read-only access strictly for statement discovery.
                        </p>
                        {summary.gmailConnectedAt && (
                          <span className="meta-text">
                            Connected since {new Date(summary.gmailConnectedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="row-action">
                        <button
                          type="button"
                          className="btn-disconnect"
                          onClick={handleDisconnectGmail}
                          disabled={updating === 'disconnect_gmail'}
                        >
                          {updating === 'disconnect_gmail' ? 'Disconnecting…' : 'Disconnect Gmail'}
                        </button>
                      </div>
                    </div>

                    <div className="consent-row">
                      <div className="row-info">
                        <div className="row-title">
                          <h3>Store Derived Financial Summaries</h3>
                          <span className={`badge ${summary.consents.persist_derived === 'granted' ? 'badge-active' : 'badge-inactive'}`}>
                            {summary.consents.persist_derived === 'granted' ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <p>
                          Allow CardMax to securely save derived summary metadata (billing cycle dates, statement amounts due) to track spending trends over time.
                        </p>
                      </div>
                      <div className="row-action">
                        <label className="switch-wrapper">
                          <input
                            type="checkbox"
                            checked={summary.consents.persist_derived === 'granted'}
                            onChange={() => handleConsentToggle('persist_derived', summary.consents.persist_derived)}
                            disabled={updating === 'persist_derived'}
                            aria-label="Toggle store financial summaries"
                          />
                          <span className="switch-slider" />
                        </label>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="consent-row">
                    <div className="row-info">
                      <div className="row-title">
                        <h3>Gmail Statements</h3>
                        <span className="badge badge-inactive">Not Connected</span>
                      </div>
                      <p>
                        Connect your Gmail with read-only access to automatically discover statements and unlock optimal reward recommendations.
                      </p>
                    </div>
                    <div className="row-action">
                      <Link href="/gmail" className="btn-connect">
                        Connect Gmail
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 3. Communications */}
            <section className="consent-card">
              <div className="card-header">
                <h2>Marketing & Product Communications</h2>
                <p>Control optional updates and card perk advice.</p>
              </div>

              <div className="consent-items-list">
                <div className="consent-row">
                  <div className="row-info">
                    <div className="row-title">
                      <h3>Product Updates & Credit Card Tips</h3>
                      <span className={`badge ${summary?.marketing ? 'badge-active' : 'badge-inactive'}`}>
                        {summary?.marketing ? 'Subscribed' : 'Off'}
                      </span>
                    </div>
                    <p>
                      Receive occasional advice on maximizing credit card bonuses, reward alerts, and new features. Unsubscribe anytime.
                    </p>
                    <span className="meta-text">
                      Critical security and authentication alerts are always sent regardless of this preference.
                    </span>
                  </div>
                  <div className="row-action">
                    <label className="switch-wrapper">
                      <input
                        type="checkbox"
                        checked={Boolean(summary?.marketing)}
                        onChange={handleMarketingToggle}
                        disabled={updating === 'marketing'}
                        aria-label="Toggle marketing emails"
                      />
                      <span className="switch-slider" />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Legal Documents & Acknowledgements */}
            <section className="consent-card">
              <div className="card-header">
                <h2>Legal Terms & Policies</h2>
                <p>Governing legal documentation and accepted policy versions.</p>
              </div>

              <div className="legal-links-list">
                <div className="legal-row">
                  <span className="legal-name">Terms of Service</span>
                  <div className="legal-action-group">
                    <span className="version-pill">
                      {summary?.legalVersions.tosVersion
                        ? `v${summary.legalVersions.tosVersion}`
                        : 'Accepted'}
                    </span>
                    <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="legal-link">
                      View Terms &rarr;
                    </Link>
                  </div>
                </div>

                <div className="legal-row">
                  <span className="legal-name">Privacy Policy</span>
                  <div className="legal-action-group">
                    <span className="version-pill">
                      {summary?.legalVersions.privacyNoticeVersion
                        ? `v${summary.legalVersions.privacyNoticeVersion}`
                        : 'Accepted'}
                    </span>
                    <Link href="/privacy-and-policy" target="_blank" rel="noopener noreferrer" className="legal-link">
                      View Privacy Notice &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
