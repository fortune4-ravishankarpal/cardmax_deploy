'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { EMPLOYMENT_TYPES } from '@/auth/profileOptions'
import './styles.scss'

export interface UserProfileData {
  id: string | number
  name: string
  email: string
  phone: string
  income: number | null
  employmentType: string | null
  authenticationProvider: string
  profileCompleted: boolean
  accountStatus: string
  createdAt?: string
  marketingConsent?: boolean
  stats?: {
    activeCardsCount: number
    totalCardsCount: number
    subscriptionStatus: string
  }
}

interface ProfileViewProps {
  initialUser: UserProfileData
}

export function ProfileView({ initialUser }: ProfileViewProps) {
  const [user, setUser] = useState<UserProfileData>(initialUser)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [updatingMarketing, setUpdatingMarketing] = useState(false)
  const [alert, setAlert] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: initialUser.name || '',
    phone: initialUser.phone || '',
    income: initialUser.income != null ? String(initialUser.income) : '',
    employmentType: initialUser.employmentType || '',
  })

  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string; income?: string }>({})

  // Format currency
  const formatCurrency = (val: number | null) => {
    if (val == null) return null
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  // Get Initials for Avatar
  const getInitials = (name?: string, email?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/)
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return parts[0].slice(0, 2).toUpperCase()
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'CM'
  }

  const handleStartEdit = () => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      income: user.income != null ? String(user.income) : '',
      employmentType: user.employmentType || '',
    })
    setFormErrors({})
    setIsEditing(true)
    setAlert(null)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setFormErrors({})
  }

  const validateForm = () => {
    const errors: { name?: string; phone?: string; income?: string } = {}
    if (!formData.name.trim()) {
      errors.name = 'Full name is required.'
    }
    if (formData.income && (Number.isNaN(Number(formData.income)) || Number(formData.income) < 0)) {
      errors.income = 'Please enter a valid non-negative income amount.'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    setAlert(null)

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          income: formData.income.trim() ? Number(formData.income) : null,
          employmentType: formData.employmentType || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.')
      }

      setUser((prev) => ({
        ...prev,
        name: data.user.name,
        phone: data.user.phone,
        income: data.user.income,
        employmentType: data.user.employmentType,
      }))

      setIsEditing(false)
      setAlert({ text: 'Profile updated successfully!', type: 'success' })
    } catch (err: any) {
      setAlert({ text: err.message || 'Error updating profile.', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleMarketingToggle = async () => {
    const nextVal = !user.marketingConsent
    setUpdatingMarketing(true)
    setAlert(null)

    try {
      const res = await fetch('/api/users/consent/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketing: nextVal }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update marketing preference.')

      setUser((prev) => ({ ...prev, marketingConsent: nextVal }))
      setAlert({
        text: nextVal ? 'Subscribed to product updates & reward tips.' : 'Unsubscribed from marketing communications.',
        type: 'success',
      })
    } catch (err: any) {
      setAlert({ text: err.message || 'Failed to update preference.', type: 'error' })
    } finally {
      setUpdatingMarketing(false)
    }
  }

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to sign out of CardMax?')) return
    setLoggingOut(true)
    try {
      await fetch('/api/users/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (err) {
      console.error(err)
      window.location.href = '/login'
    }
  }

  const employmentLabel =
    EMPLOYMENT_TYPES.find((t) => t.value === user.employmentType)?.label || user.employmentType

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        {/* Feedback Alert */}
        {alert && (
          <div className={`profile-alert ${alert.type}`} role="alert">
            <div className="alert-content">
              <span className="alert-icon">{alert.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{alert.text}</span>
            </div>
            <button
              type="button"
              className="alert-close"
              onClick={() => setAlert(null)}
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        )}

        {/* Hero Identity Banner */}
        <section className="profile-hero">
          <div className="hero-main">
            <div className="hero-identity">
              <div className="avatar" aria-hidden="true">
                {getInitials(user.name, user.email)}
              </div>
              <div className="user-meta">
                <div className="name-row">
                  <h1>{user.name || 'CardMax Member'}</h1>
                  <span className={`badge status-${user.accountStatus || 'active'}`}>
                    {user.accountStatus || 'Active'}
                  </span>
                  <span className="badge provider-badge">
                    {user.authenticationProvider === 'google' ? 'Google Account' : 'Verified Member'}
                  </span>
                </div>
                <div className="contact-info">
                  {user.email && (
                    <span>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {user.email}
                    </span>
                  )}
                  {user.phone && (
                    <span>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {user.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="hero-actions">
              {!isEditing ? (
                <button
                  type="button"
                  id="btn-edit-profile-hero"
                  className="btn-hero primary"
                  onClick={handleStartEdit}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-hero secondary"
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              )}
              <Link href="/settings/consent" className="btn-hero secondary">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Privacy & Consent
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <section className="stats-grid" aria-label="Account statistics">
          <Link href="/wallet" className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Wallet Cards</div>
              <div className="stat-value">{user.stats?.activeCardsCount ?? 0} Active</div>
              <div className="stat-link">
                Manage wallet &rarr;
              </div>
            </div>
            <div className="stat-icon cards" aria-hidden="true">
              💳
            </div>
          </Link>

          <Link href="/subscription" className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Membership Tier</div>
              <div className="stat-value">
                {user.stats?.subscriptionStatus === 'active' ? 'CardMax Pro' : 'Free Tier'}
              </div>
              <div className="stat-link">
                View benefits &rarr;
              </div>
            </div>
            <div className="stat-icon plan" aria-hidden="true">
              ⭐
            </div>
          </Link>

          <Link href="/settings/consent" className="stat-card">
            <div className="stat-content">
              <div className="stat-label">Consent & Security</div>
              <div className="stat-value">Compliant</div>
              <div className="stat-link">
                Review permissions &rarr;
              </div>
            </div>
            <div className="stat-icon security" aria-hidden="true">
              🛡️
            </div>
          </Link>
        </section>

        {/* Two-Column Layout */}
        <div className="profile-layout">
          {/* Main Column */}
          <div className="main-column">
            {/* Personal & Financial Details Card */}
            <article className="profile-card">
              <div className="card-header">
                <div className="card-title-group">
                  <h2>Personal & Financial Information</h2>
                  <p>Details used to personalize your rewards and credit recommendations.</p>
                </div>
                <button
                  type="button"
                  id="btn-edit-details"
                  className={`btn-edit-toggle ${isEditing ? 'active' : ''}`}
                  onClick={() => (isEditing ? handleCancelEdit() : handleStartEdit())}
                >
                  {isEditing ? 'Cancel' : 'Edit Info'}
                </button>
              </div>

              {!isEditing ? (
                /* View Mode */
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Full Name</span>
                    <span className={`detail-value ${!user.name ? 'empty' : ''}`}>
                      {user.name || 'Not provided'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Email Address</span>
                    <span className="detail-value">{user.email || 'None'}</span>
                    <span className="detail-hint">Primary login identifier</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Phone Number</span>
                    <span className={`detail-value ${!user.phone ? 'empty' : ''}`}>
                      {user.phone || 'Not provided'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Monthly Income</span>
                    <span className={`detail-value ${user.income == null ? 'empty' : ''}`}>
                      {user.income != null ? `${formatCurrency(user.income)} / month` : 'Not specified'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Employment Status</span>
                    <span className={`detail-value ${!employmentLabel ? 'empty' : ''}`}>
                      {employmentLabel || 'Not specified'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-label">Member Since</span>
                    <span className="detail-value">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                    </span>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <form className="profile-form" onSubmit={handleSaveProfile}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="name-input">Full Name *</label>
                      <input
                        id="name-input"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your full name"
                        required
                      />
                      {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email-input">Email Address</label>
                      <input
                        id="email-input"
                        type="email"
                        value={user.email}
                        disabled
                        title="Email is locked to your authenticated identity."
                      />
                      <span className="field-help">Locked to your authenticated account credentials.</span>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone-input">Phone Number</label>
                      <input
                        id="phone-input"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9876543210"
                      />
                      {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="income-input">Monthly Income (INR)</label>
                      <div className="input-affix-wrapper">
                        <span className="affix">₹</span>
                        <input
                          id="income-input"
                          type="number"
                          min="0"
                          step="1000"
                          value={formData.income}
                          onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                          placeholder="75000"
                        />
                      </div>
                      {formErrors.income && <span className="field-error">{formErrors.income}</span>}
                      <span className="field-help">Used to tailor reward thresholds and card recommendations.</span>
                    </div>

                    <div className="form-group">
                      <label htmlFor="employment-select">Employment Type</label>
                      <select
                        id="employment-select"
                        value={formData.employmentType}
                        onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                      >
                        <option value="">Select employment status...</option>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="btn-save-profile"
                      className="btn btn-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner" /> Saving…
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </article>

            {/* Account & Security Information */}
            <article className="profile-card">
              <div className="card-header">
                <div className="card-title-group">
                  <h2>Account Credentials & Security</h2>
                  <p>Authentication provider and security status.</p>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Authentication Method</span>
                  <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                    {user.authenticationProvider === 'google'
                      ? 'Google OAuth 2.0'
                      : user.authenticationProvider === 'phone'
                      ? 'SMS One-Time Password'
                      : 'Email Authentication'}
                  </span>
                  <span className="detail-hint">Secured with session cookies</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Account Identifier</span>
                  <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    USER-{user.id}
                  </span>
                  <span className="detail-hint">Internal CardMax ID</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Profile Completion</span>
                  <span className="detail-value">
                    {user.profileCompleted ? '✓ 100% Completed' : 'Pending requirements'}
                  </span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Terms & Privacy</span>
                  <span className="detail-value">Accepted & Versioned</span>
                  <span className="detail-hint">Audit logs stored</span>
                </div>
              </div>
            </article>
          </div>

          {/* Side Column */}
          <aside className="side-column">
            {/* Quick Links Card */}
            <div className="profile-card">
              <div className="card-header">
                <div className="card-title-group">
                  <h2>Connected Services</h2>
                </div>
              </div>

              <nav className="quick-links-list" aria-label="Connected Services">
                <Link href="/wallet" className="quick-link-item">
                  <div className="link-left">
                    <span className="link-icon">💳</span>
                    <span>My Credit Cards</span>
                  </div>
                  <span className="link-arrow">&rarr;</span>
                </Link>

                <Link href="/subscription" className="quick-link-item">
                  <div className="link-left">
                    <span className="link-icon">⭐</span>
                    <span>Subscription & Plans</span>
                  </div>
                  <span className="link-arrow">&rarr;</span>
                </Link>

                <Link href="/settings/consent" className="quick-link-item">
                  <div className="link-left">
                    <span className="link-icon">🛡️</span>
                    <span>Privacy & Consent</span>
                  </div>
                  <span className="link-arrow">&rarr;</span>
                </Link>

                <Link href="/gmail" className="quick-link-item">
                  <div className="link-left">
                    <span className="link-icon">✉️</span>
                    <span>Gmail Statement Sync</span>
                  </div>
                  <span className="link-arrow">&rarr;</span>
                </Link>
              </nav>
            </div>

            {/* Email Preferences Card */}
            <div className="profile-card">
              <div className="card-header">
                <div className="card-title-group">
                  <h2>Communications</h2>
                </div>
              </div>

              <div className="preference-row">
                <div className="pref-text">
                  <h3>Product Updates & Tips</h3>
                  <p>Receive occasional updates about new features and rewards optimization advice.</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={Boolean(user.marketingConsent)}
                    onChange={handleMarketingToggle}
                    disabled={updatingMarketing}
                    aria-label="Toggle product updates"
                  />
                  <span className="slider" />
                </label>
              </div>
            </div>

            {/* Sign Out Card */}
            <div className="profile-card card-danger">
              <div className="card-header">
                <div className="card-title-group">
                  <h2>Account Session</h2>
                </div>
              </div>

              <button
                type="button"
                id="btn-logout"
                className="btn-logout"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {loggingOut ? 'Signing out…' : 'Sign Out of Account'}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
