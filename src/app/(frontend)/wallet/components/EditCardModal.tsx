'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'

export interface WalletCardItem {
  id: string
  card?: {
    id?: string
    name?: string
    bank?: {
      name?: string
    } | string
    network?: string
  } | string
  creditCard?: {
    id?: string
    name?: string
    bank?: {
      name?: string
    } | string
    network?: string
  } | string
  bankName?: string
  cardName?: string
  displayName?: string | null
  status?: 'active' | 'deactivated' | 'closed'
  creditLimit?: number | null
  statementDay?: number | null
  paymentDueDay?: number | null
  billingCycleDay?: number | null
  physicalCard?: {
    id?: string
    panMasked?: string | null
    panLast4?: string | null
    brand?: string | null
    expiryMonth?: number | null
    expiryYear?: number | null
  } | string | null
}

interface EditCardModalProps {
  isOpen: boolean
  card: WalletCardItem | null
  onClose: () => void
  onCardUpdated: () => void
}

export default function EditCardModal({
  isOpen,
  card,
  onClose,
  onCardUpdated,
}: EditCardModalProps) {
  const [displayName, setDisplayName] = useState('')
  const [creditLimitRaw, setCreditLimitRaw] = useState('')
  const [statementDay, setStatementDay] = useState<number | ''>('')
  const [paymentDueDay, setPaymentDueDay] = useState<number | ''>('')
  const [status, setStatus] = useState<'active' | 'deactivated' | 'closed'>('active')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Populate form fields when card changes or modal opens
  useEffect(() => {
    if (!isOpen || !card) return

    setDisplayName(card.displayName || '')
    setCreditLimitRaw(card.creditLimit != null ? String(card.creditLimit) : '')
    setStatementDay(card.statementDay != null ? card.statementDay : '')
    setPaymentDueDay(
      card.paymentDueDay != null
        ? card.paymentDueDay
        : card.billingCycleDay != null
          ? card.billingCycleDay
          : '',
    )
    setStatus(card.status || 'active')
    setFormError(null)
  }, [isOpen, card])

  // ESC key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Resolve card name and bank for display
  const { cardName, bankName } = useMemo(() => {
    if (!card) return { cardName: 'Credit Card', bankName: 'Bank' }

    const cardObj =
      typeof card.card === 'object' && card.card
        ? card.card
        : typeof card.creditCard === 'object' && card.creditCard
          ? card.creditCard
          : null

    const bName =
      (typeof cardObj?.bank === 'object' && cardObj.bank?.name) ||
      (typeof cardObj?.bank === 'string' && cardObj.bank) ||
      card.bankName ||
      'Bank'

    const cName = cardObj?.name || card.cardName || 'Credit Card'

    return { cardName: cName, bankName: bName }
  }, [card])

  // Credit limit formatting helper
  const formattedLimitPreview = useMemo(() => {
    const num = parseInt(creditLimitRaw.replace(/\D/g, ''), 10)
    return isNaN(num) ? '' : num.toLocaleString('en-IN')
  }, [creditLimitRaw])

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numericOnly = e.target.value.replace(/\D/g, '')
    setCreditLimitRaw(numericOnly)
  }

  // Auto-calculate Payment Due Day as statementDay + 20 days
  const handleAutoCalculateDueDay = useCallback(() => {
    if (typeof statementDay === 'number' && statementDay >= 1 && statementDay <= 31) {
      let due = statementDay + 20
      if (due > 30) due = due - 30
      setPaymentDueDay(due)
    }
  }, [statementDay])

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!card) return
    setFormError(null)

    const limitNum = creditLimitRaw ? parseInt(creditLimitRaw, 10) : null
    if (limitNum !== null && (isNaN(limitNum) || limitNum < 0)) {
      setFormError('Please enter a valid credit limit.')
      return
    }

    if (statementDay !== '' && (statementDay < 1 || statementDay > 31)) {
      setFormError('Statement day must be between 1 and 31.')
      return
    }

    if (paymentDueDay !== '' && (paymentDueDay < 1 || paymentDueDay > 31)) {
      setFormError('Payment due day must be between 1 and 31.')
      return
    }

    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        displayName: displayName.trim() || null,
        creditLimit: limitNum,
        statementDay: typeof statementDay === 'number' ? statementDay : null,
        paymentDueDay: typeof paymentDueDay === 'number' ? paymentDueDay : null,
        billingCycleDay: typeof paymentDueDay === 'number' ? paymentDueDay : null,
        status,
      }

      const res = await fetch(`/api/user-cards/${card.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.errors?.[0]?.message || errorData.error || 'Failed to update card details.',
        )
      }

      onCardUpdated()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while updating the card.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen || !card) return null

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-card-modal-title"
      >
        <header className="modal-header">
          <div className="modal-title-wrap">
            <h2 id="edit-card-modal-title">Edit Card Details</h2>
            <p className="modal-subtitle">
              Update your credit limit, statement cycle days, and status.
            </p>
          </div>
          <button
            type="button"
            className="modal-btn-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          {formError && (
            <div className="modal-alert error" role="alert">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          {/* Read-Only Card Header Banner */}
          <div className="editing-card-banner">
            <div className="editing-card-left">
              <span className="card-bank-tag">{bankName}</span>
              <h3 className="card-display-title">{displayName || cardName}</h3>
              {displayName && <span className="card-product-sub">{cardName}</span>}
            </div>
            <div className="status-selector-wrap">
              <label htmlFor="card-status-select" className="sr-only">Card Status</label>
              <select
                id="card-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'deactivated' | 'closed')}
                className={`status-select ${status}`}
              >
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {typeof card?.physicalCard === 'object' && card.physicalCard?.panMasked && (
            <div className="linked-vault-banner">
              <div className="vault-banner-left">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="vault-banner-pan">
                  Vault Card: <strong>{card.physicalCard.panMasked}</strong>
                </span>
              </div>
              <div className="vault-banner-right">
                {card.physicalCard.expiryMonth && card.physicalCard.expiryYear && (
                  <span className="vault-banner-exp">
                    Exp {String(card.physicalCard.expiryMonth).padStart(2, '0')}/
                    {String(card.physicalCard.expiryYear).slice(-2)}
                  </span>
                )}
                {card.physicalCard.brand && (
                  <span className="vault-banner-brand">
                    {card.physicalCard.brand.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Section 1: Nickname */}
          <div className="form-group">
            <label htmlFor="edit-display-name" className="form-label">
              Card Nickname <span className="optional-tag">(Optional)</span>
            </label>
            <input
              id="edit-display-name"
              type="text"
              placeholder="e.g., Primary Spender"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="modal-input"
              maxLength={40}
            />
          </div>

          {/* Section 2: Credit Limit with INR Preview */}
          <div className="form-group">
            <label htmlFor="edit-credit-limit" className="form-label">
              Credit Limit
            </label>
            <div className="currency-input-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                id="edit-credit-limit"
                type="text"
                inputMode="numeric"
                placeholder="e.g., 1,50,000"
                value={creditLimitRaw ? parseInt(creditLimitRaw, 10).toLocaleString('en-IN') : ''}
                onChange={handleLimitChange}
                className="modal-input currency-input"
              />
              {formattedLimitPreview && (
                <span className="limit-formatted-badge">₹{formattedLimitPreview}</span>
              )}
            </div>
            <span className="input-hint">Your maximum spending limit on this account.</span>
          </div>

          {/* Section 3: Statement Day & Payment Due Day */}
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="edit-statement-day" className="form-label">
                Statement Day <span className="optional-tag">(1–31)</span>
              </label>
              <input
                id="edit-statement-day"
                type="number"
                min={1}
                max={31}
                placeholder="e.g., 15"
                value={statementDay}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                  setStatementDay(val)
                }}
                className="modal-input"
              />
              <span className="input-hint">Monthly bill generation day</span>
            </div>

            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="edit-due-day" className="form-label">
                  Payment Due Day <span className="optional-tag">(1–31)</span>
                </label>
                {typeof statementDay === 'number' && statementDay >= 1 && (
                  <button
                    type="button"
                    className="btn-auto-calc"
                    onClick={handleAutoCalculateDueDay}
                    title="Auto-calculate as 20 days after statement generation"
                  >
                    +20 Days
                  </button>
                )}
              </div>
              <input
                id="edit-due-day"
                type="number"
                min={1}
                max={31}
                placeholder="e.g., 5"
                value={paymentDueDay}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10)
                  setPaymentDueDay(val)
                }}
                className="modal-input"
              />
              <span className="input-hint">Payment deadline day</span>
            </div>
          </div>

          {/* Modal Actions */}
          <footer className="modal-footer">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="btn-spinner" />
                  Saving Changes…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
