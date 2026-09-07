'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import './styles.scss'

export default function SubscriptionPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/subscriptions/me')
      if (!res.ok) throw new Error('Failed to fetch subscriptions')
      const data = await res.json()
      setSubscriptions(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return

    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: id }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel')
      }

      await fetchSubscriptions()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="subscription-page-wrapper">
      <div className="subscription-container">
        {/* Navigation Breadcrumb */}
        <div className="sub-breadcrumb">
          <Link href="/profile" className="btn-back">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Profile
          </Link>
        </div>

        {/* Header */}
        <header className="sub-header">
          <div className="header-text">
            <h1>Subscription & Plans</h1>
            <p>Manage your CardMax membership tier, billing cycle, and unlocked benefits.</p>
          </div>
          <Link href="/max-pro" className="btn-pro-link">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            View Pro Benefits
          </Link>
        </header>

        {error && (
          <div className="sub-alert error" role="alert">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="sub-loading">
            <span className="loading-spinner" />
            <p>Loading subscription details…</p>
          </div>
        ) : subscriptions.length === 0 ? (
          /* Free Tier / No Active Subscriptions */
          <div className="sub-card free-tier-card">
            <div className="plan-header">
              <div className="plan-title-block">
                <span className="badge badge-free">Free Tier</span>
                <h2>Standard Membership</h2>
                <p>You are currently enjoying free access to basic credit card reward tracking.</p>
              </div>
            </div>

            <div className="features-preview">
              <div className="feature-item">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Track multiple credit cards in your wallet</span>
              </div>
              <div className="feature-item">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Automated statement sync via Gmail</span>
              </div>
              <div className="feature-item">
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Basic reward rate insights</span>
              </div>
            </div>

            <div className="plan-footer">
              <div className="pro-callout">
                <strong>Want AI optimization and real-time spend advice?</strong>
                <span>Upgrade to CardMax Pro for full portfolio maximization.</span>
              </div>
              <Link href="/max-pro" className="btn-primary">
                Upgrade to CardMax Pro
              </Link>
            </div>
          </div>
        ) : (
          /* Active Subscriptions */
          <div className="subscriptions-list">
            {subscriptions.map((sub) => (
              <article key={sub.id} className="sub-card">
                <div className="plan-header">
                  <div className="plan-title-block">
                    <span className={`badge status-${sub.status}`}>
                      {sub.status.replace('_', ' ')}
                    </span>
                    <h2>CardMax Pro Membership</h2>
                  </div>
                </div>

                <div className="detail-rows">
                  <div className="detail-row">
                    <span className="label">Plan ID</span>
                    <span className="value font-mono">{sub.providerSubscriptionId}</span>
                  </div>

                  <div className="detail-row">
                    <span className="label">Current Period End</span>
                    <span className="value">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {sub.cancelAtPeriodEnd && (
                    <div className="detail-row note-row">
                      <span className="label">Status Notice</span>
                      <span className="value warning-text">Will cancel at the end of the billing period</span>
                    </div>
                  )}
                </div>

                <div className="plan-footer">
                  {!sub.cancelAtPeriodEnd && !['canceled', 'expired'].includes(sub.status) && (
                    <button
                      type="button"
                      className="btn-danger-outline"
                      onClick={() => handleCancel(sub.id)}
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
