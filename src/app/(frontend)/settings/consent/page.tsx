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

  if (loading) {
    return (
      <div className="consent-page">
        <div className="loading-state">
          <p>Loading your privacy & consent settings…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="consent-page">
      <div className="header-section">
        <h1>Privacy & Consent Settings</h1>
        <p className="description">
          Manage how CardMax processes your personal and financial data. Required services
          are essential for account operation and cannot be turned off.
        </p>
      </div>

      {message && (
        <div className={`message ${message.type}`} role="status">
          {message.text}
        </div>
      )}

      {/* ── 1. Account & Service ── */}
      <div className="section-block">
        <div className="section-title">Account & Core Service</div>
        <div className="consent-list">
          <div className="consent-item">
            <div className="info">
              <div className="item-header">
                <h3>Identity & Account Profile</h3>
                <span className="status-badge required">Required</span>
              </div>
              <p>
                Your name, verified email, and phone number are used to identify you, secure your login,
                and send critical account security notices.
              </p>
            </div>
          </div>

          <div className="consent-item">
            <div className="info">
              <div className="item-header">
                <h3>Billing & Subscriptions</h3>
                <span className="status-badge required">Required</span>
              </div>
              <p>
                Subscription status, invoices, and payment event records necessary to administer
                your CardMax account and fulfill contractual obligations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Gmail Integration ── */}
      <div className="section-block">
        <div className="section-title">Gmail & Statement Data</div>
        <div className="consent-list">
          {summary?.gmailConnected ? (
            <>
              <div className="consent-item">
                <div className="info">
                  <div className="item-header">
                    <h3>Gmail Connection</h3>
                    <span className="status-badge active">Connected</span>
                  </div>
                  <p>
                    Connected as <strong>{summary.gmailAddress}</strong>.
                    CardMax uses read-only access to scan for credit card statement emails.
                  </p>
                  {summary.gmailConnectedAt && (
                    <div className="meta-info">
                      Connected since {new Date(summary.gmailConnectedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="action-control">
                  <button
                    type="button"
                    className="btn-action btn-disconnect"
                    onClick={handleDisconnectGmail}
                    disabled={updating === 'disconnect_gmail'}
                  >
                    {updating === 'disconnect_gmail' ? 'Disconnecting…' : 'Disconnect Gmail'}
                  </button>
                </div>
              </div>

              <div className="consent-item">
                <div className="info">
                  <div className="item-header">
                    <h3>Store Financial Summaries</h3>
                    <span className={`status-badge ${summary.consents.persist_derived === 'granted' ? 'active' : 'inactive'}`}>
                      {summary.consents.persist_derived === 'granted' ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p>
                    Allow CardMax to store derived summary metadata (billing period dates, total amount due,
                    and transaction counts) so you can view spending history over time. If disabled, statements
                    are analyzed only in-session and derived summaries are not saved.
                  </p>
                </div>
                <div className="action-control">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={summary.consents.persist_derived === 'granted'}
                      onChange={() => handleConsentToggle('persist_derived', summary.consents.persist_derived)}
                      disabled={updating === 'persist_derived'}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <div className="consent-item">
              <div className="info">
                <div className="item-header">
                  <h3>Gmail Statements</h3>
                  <span className="status-badge inactive">Not Connected</span>
                </div>
                <p>
                  Connect your Gmail with read-only access to automatically import credit card statements
                  and discover reward opportunities.
                </p>
              </div>
              <div className="action-control">
                <Link href="/gmail" className="btn-action btn-connect">
                  Connect Gmail
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Communications ── */}
      <div className="section-block">
        <div className="section-title">Communications</div>
        <div className="consent-list">
          <div className="consent-item">
            <div className="info">
              <div className="item-header">
                <h3>Product Updates & Credit Card Tips</h3>
                <span className={`status-badge ${summary?.marketing ? 'active' : 'inactive'}`}>
                  {summary?.marketing ? 'Subscribed' : 'Off'}
                </span>
              </div>
              <p>
                Receive occasional emails about new CardMax features, credit card reward strategies,
                and milestone tips. You can unsubscribe at any time.
              </p>
              <div className="meta-info">
                Transactional notifications (OTP codes, billing alerts, security notices) are always sent.
              </div>
            </div>
            <div className="action-control">
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={Boolean(summary?.marketing)}
                  onChange={handleMarketingToggle}
                  disabled={updating === 'marketing'}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Legal Documents & Acknowledgements ── */}
      <div className="section-block">
        <div className="section-title">Legal Terms & Policies</div>
        <div className="legal-card">
          <div className="legal-row">
            <span className="legal-label">Terms of Service</span>
            <div className="legal-status">
              <span className="version-tag">
                {summary?.legalVersions.tosVersion
                  ? `Version ${summary.legalVersions.tosVersion}`
                  : 'Not recorded'}
              </span>
              <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                View Terms
              </Link>
            </div>
          </div>

          <div className="legal-row">
            <span className="legal-label">Privacy Notice</span>
            <div className="legal-status">
              <span className="version-tag">
                {summary?.legalVersions.privacyNoticeVersion
                  ? `Version ${summary.legalVersions.privacyNoticeVersion}`
                  : 'Not recorded'}
              </span>
              <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                View Privacy Notice
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
