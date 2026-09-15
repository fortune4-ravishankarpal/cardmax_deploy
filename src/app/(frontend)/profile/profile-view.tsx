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
  pan?: string | null
  hasPan?: boolean
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
    pan: initialUser.pan || '',
  })

  const [formErrors, setFormErrors] = useState<{
    name?: string
    phone?: string
    income?: string
    pan?: string
  }>({})

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
      pan: user.pan || '',
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
    const errors: { name?: string; phone?: string; income?: string; pan?: string } = {}
    if (!formData.name.trim()) {
      errors.name = 'Full name is required.'
    }
    if (formData.income && (Number.isNaN(Number(formData.income)) || Number(formData.income) < 0)) {
      errors.income = 'Please enter a valid non-negative income amount.'
    }
    if (formData.pan && formData.pan.trim()) {
      const cleanPan = formData.pan.trim().toUpperCase()
      // If user didn't modify an existing masked PAN, allow it
      if (!cleanPan.startsWith('XXXXXX') && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
        errors.pan = 'Please enter a valid 10-character PAN (e.g. ABCDE1234F).'
      }
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
      const body: Record<string, unknown> = {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        income: formData.income.trim() ? Number(formData.income) : null,
        employmentType: formData.employmentType || null,
      }

      if (formData.pan && formData.pan.trim()) {
        const cleanPan = formData.pan.trim().toUpperCase()
        if (!cleanPan.startsWith('XXXXXX')) {
          body.pan = cleanPan
        }
      } else if (user.hasPan && !formData.pan) {
        body.pan = null
      }

      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
        pan: data.user.pan !== undefined ? data.user.pan : prev.pan,
        hasPan: data.user.hasPan !== undefined ? data.user.hasPan : prev.hasPan,
      }))

      setIsEditing(false)
      setAlert({ text: 'Profile updated successfully.', type: 'success' })
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
        text: nextVal
          ? 'Subscribed to product updates & recommendations.'
          : 'Unsubscribed from marketing communications.',
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
              <span className="alert-icon" aria-hidden="true">
                {alert.type === 'success' ? (
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </span>
              <span>{alert.text}</span>
            </div>
            <button
              type="button"
              className="alert-close"
              onClick={() => setAlert(null)}
              aria-label="Dismiss notification"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* 1. Compact Profile Header */}
        <section className="profile-header" aria-label="Profile identity header">
          <div className="header-primary">
            <div className="avatar" aria-hidden="true">
              {getInitials(user.name, user.email)}
            </div>

            <div className="user-details">
              <div className="name-line">
                <h1>{user.name || 'CardMax Member'}</h1>
                <span className="status-indicator">
                  <span className="dot" />
                  {user.accountStatus || 'Active'}
                </span>
                <span className="provider-pill">
                  {user.authenticationProvider === 'google' ? 'Google Account' : 'Verified Email'}
                </span>
              </div>

              <div className="meta-list">
                {user.email && (
                  <span className="meta-item">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {user.email}
                  </span>
                )}
                {user.phone && (
                  <span className="meta-item">
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {user.phone}
                  </span>
                )}
                {user.createdAt && (
                  <span className="meta-item" suppressHydrationWarning>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="header-actions">
            {!isEditing ? (
              <button
                type="button"
                id="btn-edit-profile-hero"
                className="btn-action primary"
                onClick={handleStartEdit}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit Profile
              </button>
            ) : (
              <button type="button" className="btn-action secondary" onClick={handleCancelEdit}>
                Cancel Edit
              </button>
            )}

            <Link href="/settings/consent" className="btn-action secondary">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Privacy & Consent
            </Link>
          </div>
        </section>

        {/* 2. Compact Account Overview Section (Information At-a-Glance) */}
        <section className="overview-strip" aria-label="Account Overview">
          <Link href="/wallet" className="overview-item">
            <div className="item-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div className="item-info">
              <span className="item-label">Active Cards</span>
              <span className="item-value">{user.stats?.activeCardsCount ?? 0} Active</span>
            </div>
            <span className="item-action">Manage &rarr;</span>
          </Link>


          <div className="overview-divider" aria-hidden="true" />

          <Link href="/settings/consent" className="overview-item">
            <div className="item-icon">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="item-info">
              <span className="item-label">Account Security</span>
              <span className="item-value">Protected & Compliant</span>
            </div>
            <span className="item-action">Review &rarr;</span>
          </Link>
        </section>

        {/* 3. Main Content: Two-Column SaaS Layout */}
        <div className="profile-layout">
          {/* Main Column */}
          <main className="main-column">
            <div className="content-panel">
              <div className="panel-header">
                <h2>{isEditing ? 'Edit Profile Details' : 'Account Details'}</h2>
                <p>
                  {isEditing
                    ? 'Update your personal details and income information below.'
                    : 'Personal and financial information used to personalize credit card recommendations.'}
                </p>
              </div>

              {!isEditing ? (
                /* View Mode: Clean Field-Based Layout */
                <div className="profile-fields-wrapper">
                  {/* Personal Information */}
                  <div className="fields-section">
                    <div className="section-title">Personal Information</div>
                    <div className="fields-grid">
                      <div className="field-block">
                        <span className="field-label">Full Name</span>
                        <span className={`field-value ${!user.name ? 'empty' : ''}`}>
                          {user.name || 'Not provided'}
                        </span>
                      </div>

                      <div className="field-block">
                        <span className="field-label">Email Address</span>
                        <span className="field-value email-value">
                          {user.email || 'None'}
                          <span className="verified-badge" title="Authenticated account identifier">
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0110 0v4" />
                            </svg>
                            Primary
                          </span>
                        </span>
                      </div>

                      <div className="field-block">
                        <span className="field-label">Phone Number</span>
                        <span className={`field-value ${!user.phone ? 'empty' : ''}`}>
                          {user.phone || 'Not provided'}
                        </span>
                      </div>

                      <div className="field-block">
                        <span className="field-label">Member Since</span>
                        <span className="field-value" suppressHydrationWarning>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recent member'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="fields-section">
                    <div className="section-title">Financial Information</div>
                    <div className="fields-grid">
                      <div className="field-block">
                        <span className="field-label">Monthly Income</span>
                        <span className={`field-value ${user.income == null ? 'empty' : ''}`}>
                          {user.income != null ? `${formatCurrency(user.income)} / month` : 'Not specified'}
                        </span>
                        <span className="field-note">Used to match card eligibility and spending bonuses</span>
                      </div>

                      <div className="field-block">
                        <span className="field-label">Employment Type</span>
                        <span className={`field-value ${!employmentLabel ? 'empty' : ''}`}>
                          {employmentLabel || 'Not specified'}
                        </span>
                        <span className="field-note">Helps recommend cards matching your career profile</span>
                      </div>

                      <div className="field-block">
                        <span className="field-label">Permanent Account Number (PAN)</span>
                        <div className={`field-value pan-value ${!user.pan ? 'empty' : ''}`}>
                          {user.pan ? (
                            <>
                              <span className="pan-display">
                                <span className="pan-masked-part">XXXXXX</span>
                                <span className="pan-visible-part">
                                  {user.pan.length >= 5 ? user.pan.slice(user.pan.startsWith('XXXXXX') ? 6 : 5) : user.pan}
                                </span>
                              </span>
                              <span
                                className="security-badge encrypted"
                                title="Encrypted at rest using AES-256-GCM"
                              >
                                <svg
                                  width="11"
                                  height="11"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  viewBox="0 0 24 24"
                                >
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7 11V7a5 5 0 0110 0v4"
                                  />
                                </svg>
                                Encrypted
                              </span>
                            </>
                          ) : (
                            'Not provided'
                          )}
                        </div>
                        <span className="field-note">
                          <svg
                            width="11"
                            height="11"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          Protected with AES-256-GCM encryption
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit Mode: Form View */
                <form className="edit-form" onSubmit={handleSaveProfile}>
                  <div className="form-fields-grid">
                    <div className="form-field">
                      <label htmlFor="name-input">Full Name *</label>
                      <input
                        id="name-input"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your full name"
                        required
                        className={formErrors.name ? 'has-error' : ''}
                      />
                      {formErrors.name && <span className="field-error-msg">{formErrors.name}</span>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="email-input">
                        Email Address
                        <span className="locked-tag">Locked</span>
                      </label>
                      <input
                        id="email-input"
                        type="email"
                        value={user.email}
                        disabled
                        title="Email is locked to your authenticated identity."
                      />
                      <span className="field-help-text">
                        Tied to your authenticated account credentials.
                      </span>
                    </div>

                    <div className="form-field">
                      <label htmlFor="phone-input">Phone Number</label>
                      <input
                        id="phone-input"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className={formErrors.phone ? 'has-error' : ''}
                      />
                      {formErrors.phone && <span className="field-error-msg">{formErrors.phone}</span>}
                    </div>

                    <div className="form-field">
                      <label htmlFor="income-input">Monthly Income (INR)</label>
                      <div className="input-currency-wrapper">
                        <span className="currency-prefix">₹</span>
                        <input
                          id="income-input"
                          type="number"
                          min="0"
                          step="1000"
                          value={formData.income}
                          onChange={(e) => setFormData({ ...formData, income: e.target.value })}
                          placeholder="75000"
                          className={formErrors.income ? 'has-error' : ''}
                        />
                      </div>
                      {formErrors.income ? (
                        <span className="field-error-msg">{formErrors.income}</span>
                      ) : (
                        <span className="field-help-text">
                          Used to optimize rewards, eligibility, and spend goals.
                        </span>
                      )}
                    </div>

                    <div className="form-field full-width">
                      <label htmlFor="employment-select">Employment Type</label>
                      <select
                        id="employment-select"
                        value={formData.employmentType}
                        onChange={(e) =>
                          setFormData({ ...formData, employmentType: e.target.value })
                        }
                      >
                        <option value="">Select employment status...</option>
                        {EMPLOYMENT_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field full-width">
                      <label htmlFor="pan-input">
                        Permanent Account Number (PAN)
                        <span className="field-badge-secure">AES-256-GCM Encrypted</span>
                      </label>
                      <input
                        id="pan-input"
                        type="text"
                        maxLength={10}
                        value={formData.pan}
                        onChange={(e) =>
                          setFormData({ ...formData, pan: e.target.value.toUpperCase() })
                        }
                        placeholder="ABCDE1234F"
                        style={{
                          textTransform: 'uppercase',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          letterSpacing: '0.06em',
                          fontWeight: 600,
                        }}
                        className={formErrors.pan ? 'has-error' : ''}
                      />
                      {formErrors.pan ? (
                        <span className="field-error-msg">{formErrors.pan}</span>
                      ) : (
                        <span className="field-help-text">
                          10-character alphanumeric Indian tax ID. Automatically encrypted at rest before saving.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-action-bar">
                    <button
                      type="button"
                      className="btn-control secondary"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      id="btn-save-profile"
                      className="btn-control primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="btn-spinner" aria-hidden="true" />
                          Saving…
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </main>

          {/* Sidebar Column: Compact, Unified Container */}
          <aside className="sidebar-column">
            <div className="sidebar-card">
              {/* Section 1: Connected Services */}
              <div className="sidebar-section">
                <h3 className="section-heading">Connected Services</h3>
                <nav className="nav-services-list" aria-label="Connected Services">
                  <Link href="/wallet" className="nav-service-item">
                    <div className="service-icon">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
                    <div className="service-details">
                      <span className="service-title">My Credit Cards</span>
                      <span className="service-desc">Manage wallet & card perks</span>
                    </div>
                    <svg className="service-chevron" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>


                  <Link href="/settings/consent" className="nav-service-item">
                    <div className="service-icon">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                    </div>
                    <div className="service-details">
                      <span className="service-title">Privacy & Consent</span>
                      <span className="service-desc">Data security & permissions</span>
                    </div>
                    <svg className="service-chevron" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <Link href="/gmail" className="nav-service-item">
                    <div className="service-icon">
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="service-details">
                      <span className="service-title">Gmail Statement Sync</span>
                      <span className="service-desc">Automated statement parsing</span>
                    </div>
                    <svg className="service-chevron" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </nav>
              </div>

              {/* Section 2: Communication Preferences */}
              <div className="sidebar-section">
                <h3 className="section-heading">Communication Preferences</h3>
                <div className="toggle-row">
                  <div className="toggle-info">
                    <span className="toggle-title">Product Updates & Tips</span>
                    <p className="toggle-desc">
                      Reward optimization alerts and feature updates.
                    </p>
                  </div>

                  <label className="switch-wrapper">
                    <input
                      type="checkbox"
                      checked={Boolean(user.marketingConsent)}
                      onChange={handleMarketingToggle}
                      disabled={updatingMarketing}
                      aria-label="Toggle product updates"
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              </div>

              {/* Section 3: Account Session / Sign Out */}
              <div className="sidebar-section session-section">
                <div className="session-info">
                  <span className="session-label">Account Session</span>
                  <span className="session-desc">Signed in as {user.email || 'user'}</span>
                </div>

                <button
                  type="button"
                  id="btn-logout"
                  className="btn-signout"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  {loggingOut ? 'Signing out…' : 'Sign Out'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
