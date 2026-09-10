'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import './Navbar.scss'

export interface NavbarUser {
  id: string
  email: string
  name?: string | null
  isPro?: boolean
}

interface NavbarProps {
  initialUser?: NavbarUser | null
}

const HIDDEN_ROUTES = [
  '/login',
  '/logout',
  '/consent-onboarding',
  '/complete-profile',
]

export const Navbar: React.FC<NavbarProps> = ({ initialUser }) => {
  const pathname = usePathname()
  const [user, setUser] = useState<NavbarUser | null>(initialUser ?? null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Keep state synchronized with prop updates
  useEffect(() => {
    if (initialUser !== undefined) {
      setUser(initialUser)
    }
  }, [initialUser])

  // Close menus when route changes
  useEffect(() => {
    setDropdownOpen(false)
    setMobileMenuOpen(false)
  }, [pathname])

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false)
        setMobileMenuOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dropdownOpen])

  // Hide completely on login, logout, and onboarding flows
  const shouldHide = HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
  if (shouldHide) {
    return null
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await fetch('/api/users/logout', { method: 'POST' })
      window.location.assign('/login')
    } catch {
      window.location.assign('/login')
    }
  }

  const navLinks = [
    { label: 'Dashboard', href: '/' },
    { label: 'Wallet', href: '/wallet' },
    { label: 'Max Pro', href: '/max-pro', isProHighlight: true },
    { label: 'Profile', href: '/profile' },
  ]

  const displayName = user?.name || user?.email?.split('@')[0] || 'Member'
  const userInitial = displayName.charAt(0).toUpperCase() || 'U'

  return (
    <header className="cm-navbar-container">
      <div className="cm-navbar">
        {/* Brand / Logo */}
        <Link href="/" className="cm-navbar__brand" aria-label="CardMax Home">
          <div className="cm-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="3" />
              <line x1="2" x2="22" y1="10" y2="10" />
              <line x1="6" x2="10" y1="15" y2="15" />
            </svg>
          </div>
          <div className="cm-brand-text">
            <span>Card</span>
            <span className="cm-brand-accent">Max</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="cm-navbar__nav" aria-label="Main Navigation">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`cm-nav-link ${isActive ? 'is-active' : ''}`}
              >
                <span>{link.label}</span>
                {link.isProHighlight && (
                  <span className="cm-nav-link__badge cm-nav-link__badge--pro">
                    PRO
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Actions (Right) */}
        <div className="cm-navbar__actions">
          {user ? (
            <div className="cm-profile-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className={`cm-profile-trigger ${dropdownOpen ? 'is-open' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label="User Profile Menu"
              >
                <div className={`cm-avatar ${user.isPro ? 'cm-avatar--pro' : ''}`}>
                  {userInitial}
                </div>
                <div className="cm-profile-trigger__info">
                  <span className="cm-user-name">{displayName}</span>
                  <span className={`cm-badge-mini ${user.isPro ? 'is-pro' : 'is-free'}`}>
                    {user.isPro ? 'Max Pro' : 'Free Tier'}
                  </span>
                </div>
                <svg
                  className={`cm-chevron ${dropdownOpen ? 'is-open' : ''}`}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="cm-dropdown-menu" role="menu">
                  <div className="cm-dropdown-header">
                    <span className="cm-dropdown-header__name">{displayName}</span>
                    <span className="cm-dropdown-header__email">{user.email}</span>
                    <div className="cm-dropdown-header__badge-row">
                      {user.isPro ? (
                        <span className="cm-sub-badge cm-sub-badge--pro">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          Max Pro Subscriber
                        </span>
                      ) : (
                        <span className="cm-sub-badge cm-sub-badge--free">
                          Free Member
                        </span>
                      )}
                    </div>
                  </div>

                  <Link href="/" className="cm-dropdown-item" role="menuitem">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="7" height="9" x="3" y="3" rx="1" />
                      <rect width="7" height="5" x="14" y="3" rx="1" />
                      <rect width="7" height="9" x="14" y="12" rx="1" />
                      <rect width="7" height="5" x="3" y="16" rx="1" />
                    </svg>
                    Dashboard
                  </Link>

                  <Link href="/wallet" className="cm-dropdown-item" role="menuitem">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                    </svg>
                    My Cards & Wallet
                  </Link>

                  <Link href="/profile" className="cm-dropdown-item" role="menuitem">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Account Profile
                  </Link>

                  <Link href="/max-pro" className="cm-dropdown-item" role="menuitem">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {user.isPro ? 'Max Pro Perks' : 'Upgrade to Max Pro'}
                  </Link>

                  <Link href="/settings/consent" className="cm-dropdown-item" role="menuitem">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                    </svg>
                    Consent & Privacy
                  </Link>

                  <div className="cm-dropdown-divider" />

                  <button
                    type="button"
                    className="cm-dropdown-item cm-dropdown-item--danger"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    role="menuitem"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" x2="9" y1="12" y2="12" />
                    </svg>
                    {loggingOut ? 'Signing out…' : 'Sign Out'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="cm-btn-signin">
              <span>Sign In</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="cm-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="cm-mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
          {user && (
            <div className="cm-mobile-user-card">
              <div className={`cm-avatar ${user.isPro ? 'cm-avatar--pro' : ''}`}>
                {userInitial}
              </div>
              <div className="cm-mobile-user-info">
                <div className="cm-mobile-user-name">{displayName}</div>
                <div className="cm-mobile-user-email">{user.email}</div>
                {user.isPro ? (
                  <span className="cm-sub-badge cm-sub-badge--pro">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    Max Pro
                  </span>
                ) : (
                  <span className="cm-sub-badge cm-sub-badge--free">
                    Free Member
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="cm-mobile-nav-list">
            <Link
              href="/"
              className={`cm-mobile-nav-link ${pathname === '/' ? 'is-active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="cm-mobile-nav-link__title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
                Dashboard
              </span>
            </Link>

            <Link
              href="/wallet"
              className={`cm-mobile-nav-link ${pathname === '/wallet' ? 'is-active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="cm-mobile-nav-link__title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
                </svg>
                Wallet
              </span>
            </Link>

            <Link
              href="/max-pro"
              className={`cm-mobile-nav-link ${pathname === '/max-pro' ? 'is-active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="cm-mobile-nav-link__title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                Max Pro
              </span>
              <span className="cm-sub-badge cm-sub-badge--pro">PRO</span>
            </Link>

            <Link
              href="/profile"
              className={`cm-mobile-nav-link ${pathname === '/profile' ? 'is-active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="cm-mobile-nav-link__title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Profile
              </span>
            </Link>

            <Link
              href="/settings/consent"
              className={`cm-mobile-nav-link ${pathname === '/settings/consent' ? 'is-active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="cm-mobile-nav-link__title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
                Consent Settings
              </span>
            </Link>
          </div>

          <div className="cm-mobile-footer-actions">
            {user ? (
              <button
                type="button"
                className="cm-btn-mobile-logout"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
                {loggingOut ? 'Signing out…' : 'Sign Out of CardMax'}
              </button>
            ) : (
              <Link
                href="/login"
                className="cm-btn-mobile-signin"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Sign In to CardMax</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
