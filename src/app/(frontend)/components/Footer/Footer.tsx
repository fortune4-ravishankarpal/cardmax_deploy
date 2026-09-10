'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './Footer.scss'

const HIDDEN_ROUTES = [
  '/login',
  '/logout',
  '/consent-onboarding',
  '/complete-profile',
]

export const Footer: React.FC = () => {
  const pathname = usePathname()

  const shouldHide = HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  if (shouldHide) {
    return null
  }

  const currentYear = new Date().getFullYear()

  return (
    <footer className="cm-footer" role="contentinfo">
      <div className="cm-footer__inner">
        <div className="cm-footer__grid">
          {/* Brand & Security Column */}
          <div className="cm-footer__brand-col">
            <Link href="/" className="cm-footer__brand" aria-label="CardMax Home">
              <div className="cm-footer-brand-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="3" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                  <line x1="6" x2="10" y1="15" y2="15" />
                </svg>
              </div>
              <div>
                <span>Card</span>
                <span className="cm-brand-accent">Max</span>
              </div>
            </Link>

            <p className="cm-footer__statement">
              CardMax is India&apos;s smart credit card optimization platform, helping users maximize rewards, track statement cycles, and optimize card spending seamlessly.
            </p>

            <div className="cm-footer__security">
              <div className="cm-security-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="cm-security-text">
                <strong>Bank-Grade Security</strong>
                <p>
                  ISO/IEC 27001-aligned architecture with 256-bit encryption. CardMax never stores raw CVVs or net banking credentials.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="cm-footer__col">
            <h4>Platform</h4>
            <ul className="cm-footer__links">
              <li>
                <Link href="/">Dashboard</Link>
              </li>
              <li>
                <Link href="/wallet">My Wallet</Link>
              </li>
              <li>
                <Link href="/max-pro">
                  <span>Max Pro</span>
                  <span className="cm-footer-pro-tag">PRO</span>
                </Link>
              </li>
              <li>
                <Link href="/profile">My Profile</Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Legal Column */}
          <div className="cm-footer__col">
            <h4>Legal & Privacy</h4>
            <ul className="cm-footer__links">
              <li>
                <Link href="/terms-and-conditions">Terms & Conditions</Link>
              </li>
              <li>
                <Link href="/privacy-and-policy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/settings/consent">Consent Settings</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="cm-footer__bottom">
          <p className="cm-footer__copyright">
            &copy; {currentYear} CardMax, Inc. All rights reserved.
          </p>

          <div className="cm-footer__meta">
            <div className="cm-system-status" title="All CardMax engines and sync services are operational">
              <span className="cm-status-dot" aria-hidden="true" />
              <span>Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
