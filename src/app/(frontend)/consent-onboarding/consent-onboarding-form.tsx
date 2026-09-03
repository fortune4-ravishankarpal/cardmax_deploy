'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export const ConsentOnboardingForm: React.FC = () => {
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acknowledgePrivacy, setAcknowledgePrivacy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = acceptTerms && acknowledgePrivacy && !submitting

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/users/consent/required-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptTerms, acknowledgePrivacy }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Could not record your agreement. Please try again.')
        setSubmitting(false)
        return
      }

      // Navigate to destination (dashboard or complete profile)
      window.location.href = data.nextUrl || '/'
    } catch {
      setError('Network error. Please try again.')
      setSubmitting(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' })
    } catch {
      // Continue to login regardless
    }
    window.location.href = '/login'
  }

  return (
    <div className="onboarding-card">
      <h1>Welcome to CardMax</h1>
      <p className="subtitle">
        Before you begin using the service, please review and accept our required terms and privacy notice.
      </p>

      {error && (
        <div className="error-alert" role="alert">
          {error}
        </div>
      )}

      {/* ── Required Processing Details ── */}
      <div className="info-box service-box">
        <h3>Required Service Processing</h3>
        <ul>
          <li>
            <strong>Account & Authentication:</strong> We store your verified mobile/email to secure your login and send critical billing/security notices.
          </li>
          <li>
            <strong>Card Tracking & Recommendations:</strong> We process credit card types and spending goals you select in the app to calculate fee-waiver milestones and rewards.
          </li>
          <li>
            <strong>Billing Administration:</strong> We maintain subscription status and payment records to provide access to CardMax Pro features.
          </li>
        </ul>
      </div>

      {/* ── What is explicitly NOT bundled ── */}
      <div className="info-box exclusion-box">
        <h4>What is NOT included here:</h4>
        <p>
          We will <strong>not</strong> access your Gmail inbox unless you explicitly connect it later.
          We do <strong>not</strong> send marketing emails without your separate opt-in.
          You can manage optional preferences anytime from Settings.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="acknowledgement-list">
          <div className="checkbox-item">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <label htmlFor="acceptTerms">
              I have read and agree to the{' '}
              <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </Link>
              <span className="required-star">*</span>
            </label>
          </div>

          <div className="checkbox-item">
            <input
              id="acknowledgePrivacy"
              type="checkbox"
              checked={acknowledgePrivacy}
              onChange={(e) => setAcknowledgePrivacy(e.target.checked)}
            />
            <label htmlFor="acknowledgePrivacy">
              I have read and acknowledge the{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Notice
              </Link>
              <span className="required-star">*</span>
            </label>
          </div>
        </div>

        <div className="actions-row">
          <button
            type="submit"
            className="btn-continue"
            disabled={!canSubmit}
          >
            {submitting ? 'Saving agreement…' : 'Agree & Continue'}
          </button>

          <p className="footer-note">
            If you do not agree to these terms, you may{' '}
            <button type="button" onClick={handleSignOut}>
              Sign out
            </button>
            .
          </p>
        </div>
      </form>
    </div>
  )
}
