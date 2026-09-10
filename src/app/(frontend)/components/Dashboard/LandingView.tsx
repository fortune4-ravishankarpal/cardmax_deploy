'use client'

import React from 'react'
import Link from 'next/link'

export const LandingView: React.FC = () => {
  return (
    <div className="cm-home-wrapper">
      <div className="cm-container">
        {/* Hero Section */}
        <section className="cm-landing-hero">
          <div className="cm-hero-badge">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Next-Gen Credit Card Intelligence</span>
          </div>

          <h1>
            Maximize Every Rupee Spent Across{' '}
            <span className="cm-text-gradient">All Your Credit Cards</span>
          </h1>

          <p className="cm-hero-subtitle">
            CardMax unifies your credit cards into one intelligent dashboard. Track limits, statement cycles, and automatically pick the best card to swipe for 5X–10X rewards.
          </p>

          <div className="cm-hero-actions">
            <Link href="/login" className="cm-btn-primary">
              <span>Get Started Free</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>

            <Link href="/max-pro" className="cm-btn-secondary">
              <span>Explore Max Pro</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Core Pillars / Feature Highlights */}
        <section className="cm-landing-features" aria-label="Core Features">
          <div className="cm-feature-box">
            <div className="cm-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="3" />
                <line x1="2" x2="22" y1="10" y2="10" />
                <line x1="6" x2="10" y1="15" y2="15" />
              </svg>
            </div>
            <h3>Unified Card Wallet</h3>
            <p>
              Consolidate cards from HDFC, SBI, ICICI, Axis, Amex, and more. Track aggregate limits, statement dates, and billing cycles in a single glance.
            </p>
          </div>

          <div className="cm-feature-box">
            <div className="cm-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
            </div>
            <h3>Rewards Optimizer</h3>
            <p>
              Instant recommendations on which card earns maximum cashback or reward points for dining, flights, fuel surcharge waivers, and groceries.
            </p>
          </div>

          <div className="cm-feature-box">
            <div className="cm-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
                <polyline points="22,6 12,13 2,6" />
                <circle cx="18" cy="18" r="3" />
                <polyline points="17 18 18 19 20 17" />
              </svg>
            </div>
            <h3>Automated Statement Sync</h3>
            <p>
              Connect Gmail securely using official Google OAuth. Statements are parsed automatically with bank-grade AES-256 encrypted storage.
            </p>
          </div>

          <div className="cm-feature-box">
            <div className="cm-feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3>Max Pro Intelligence</h3>
            <p>
              Upgrade to unlock AI statement OCR analysis, annual fee waiver progress trackers, and real-time payment due reminders.
            </p>
          </div>
        </section>

        {/* Trust & Security Verification Bar */}
        <section className="cm-trust-bar" aria-label="Security & Compliance Highlights">
          <div className="cm-trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>256-Bit Bank-Grade Encryption</span>
          </div>

          <div className="cm-trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>ISO/IEC 27001 Aligned</span>
          </div>

          <div className="cm-trust-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" x2="19.07" y1="4.93" y2="19.07" />
            </svg>
            <span>Zero Credential or CVV Storage</span>
          </div>
        </section>
      </div>
    </div>
  )
}
