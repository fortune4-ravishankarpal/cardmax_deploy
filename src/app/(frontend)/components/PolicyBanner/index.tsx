'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import './styles.scss'
import { CURRENT_TOS_VERSION, CURRENT_PRIVACY_VERSION } from '@/lib/consentVersions'

export const PolicyBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false)
  const [acknowledging, setAcknowledging] = useState(false)

  useEffect(() => {
    // Check if dismissed in this browser session
    if (sessionStorage.getItem('cardmax_policy_banner_dismissed') === 'true') {
      return
    }

    const checkPolicyVersion = async () => {
      try {
        const res = await fetch('/api/users/consent/summary')
        if (!res.ok) return // User not logged in or other error
        const data = await res.json()

        const tosMismatch = data?.legalVersions?.tosVersion && data.legalVersions.tosVersion !== CURRENT_TOS_VERSION
        const privacyMismatch = data?.legalVersions?.privacyNoticeVersion && data.legalVersions.privacyNoticeVersion !== CURRENT_PRIVACY_VERSION

        if (tosMismatch || privacyMismatch) {
          setShowBanner(true)
        }
      } catch {
        // Non-blocking
      }
    }

    checkPolicyVersion()
  }, [])

  const handleAcknowledge = async () => {
    setAcknowledging(true)
    try {
      const res = await fetch('/api/users/consent/acknowledge-policy', {
        method: 'POST',
      })
      if (res.ok) {
        setShowBanner(false)
      }
    } catch {
      // Non-fatal
    } finally {
      setAcknowledging(false)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem('cardmax_policy_banner_dismissed', 'true')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="policy-update-banner" role="region" aria-label="Policy Update Notice">
      <div className="banner-content">
        <div className="banner-text">
          <span className="banner-badge">Notice</span>
          <span>
            We have updated our{' '}
            <Link href="/terms-and-conditions" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy-and-policy" target="_blank" rel="noopener noreferrer">
              Privacy Notice
            </Link>
            . Please review what has changed.
          </span>
        </div>
        <div className="banner-actions">
          <button
            type="button"
            className="btn-ack"
            onClick={handleAcknowledge}
            disabled={acknowledging}
          >
            {acknowledging ? 'Updating…' : 'I Acknowledge'}
          </button>
          <button type="button" className="btn-later" onClick={handleDismiss}>
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
