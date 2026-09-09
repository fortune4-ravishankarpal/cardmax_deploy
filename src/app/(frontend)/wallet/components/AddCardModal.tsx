'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'

export interface MasterCardOption {
  id: string
  name: string
  bank?:
    | {
        name?: string
      }
    | string
  cardType?: string
  network?: string
}

interface AddCardModalProps {
  isOpen: boolean
  onClose: () => void
  onCardAdded: () => void
}

export default function AddCardModal({ isOpen, onClose, onCardAdded }: AddCardModalProps) {
  const [catalog, setCatalog] = useState<MasterCardOption[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  // Form State
  const [selectedCardId, setSelectedCardId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [creditLimitRaw, setCreditLimitRaw] = useState('')
  const [statementDay, setStatementDay] = useState<number | ''>('')
  const [paymentDueDay, setPaymentDueDay] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch CreditCard catalog on modal open
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    setCatalogLoading(true)
    setCatalogError(null)

    const fetchCatalog = async () => {
      try {
        let docs: MasterCardOption[] = []
        // Priority 1: dedicated user-cards/catalog endpoint
        const res = await fetch('/api/user-cards/catalog')
        if (res.ok) {
          const data = await res.json()
          docs = Array.isArray(data) ? data : data.docs || []
        } else {
          // Priority 2: direct CreditCard collection endpoint
          const fallbackRes = await fetch('/api/CreditCard?limit=100&depth=1')
          if (fallbackRes.ok) {
            const data = await fallbackRes.json()
            docs = data.docs || []
          } else {
            if (isMounted) setCatalogError('Could not load card catalog.')
            return
          }
        }

        if (isMounted) {
          const validCards = docs.filter((c) => Boolean(c && c.name))
          setCatalog(validCards)
        }
      } catch (err) {
        if (isMounted) {
          setCatalogError('Failed to fetch credit cards.')
        }
      } finally {
        if (isMounted) {
          setCatalogLoading(false)
        }
      }
    }

    fetchCatalog()

    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Reset form when modal closes or opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCardId('')
      setSearchQuery('')
      setDisplayName('')
      setCreditLimitRaw('')
      setStatementDay('')
      setPaymentDueDay('')
      setFormError(null)
    }
  }, [isOpen])

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

  // Filter catalog based on search query
  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return catalog
    const q = searchQuery.toLowerCase().trim()
    return catalog.filter((card) => {
      const cardName = (card.name || '').toLowerCase()
      const bankName =
        typeof card.bank === 'object' && card.bank?.name
          ? card.bank.name.toLowerCase()
          : typeof card.bank === 'string'
            ? card.bank.toLowerCase()
            : ''
      return cardName.includes(q) || bankName.includes(q)
    })
  }, [catalog, searchQuery])

  // Currently selected card object
  const selectedCard = useMemo(
    () => catalog.find((c) => c.id === selectedCardId),
    [catalog, selectedCardId],
  )

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
    console.log('handleSubmit')
    e.preventDefault()
    setFormError(null)

    if (!selectedCardId) {
      setFormError('Please select a credit card from the catalog.')
      return
    }

    const limitNum = creditLimitRaw ? parseInt(creditLimitRaw, 10) : undefined
    if (limitNum !== undefined && (isNaN(limitNum) || limitNum < 0)) {
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
        card: selectedCardId,
        status: 'active',
      }

      if (displayName.trim()) payload.displayName = displayName.trim()
      if (limitNum !== undefined) payload.creditLimit = limitNum
      if (typeof statementDay === 'number') payload.statementDay = statementDay
      if (typeof paymentDueDay === 'number') {
        payload.paymentDueDay = paymentDueDay
        payload.billingCycleDay = paymentDueDay
      }

      const res = await fetch('/api/user-cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.errors?.[0]?.message || errorData.error || 'Failed to link card to wallet.',
        )
      }

      onCardAdded()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while adding the card.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const getBankName = (card: MasterCardOption): string => {
    if (typeof card.bank === 'object' && card.bank?.name) return card.bank.name
    if (typeof card.bank === 'string') return card.bank
    return 'Bank'
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-card-modal-title"
      >
        <header className="modal-header">
          <div className="modal-title-wrap">
            <h2 id="add-card-modal-title">Add Card to Wallet</h2>
            <p className="modal-subtitle">
              Select a card from the catalog and configure your statement details.
            </p>
          </div>
          <button
            type="button"
            className="modal-btn-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          {formError && (
            <div className="modal-alert error" role="alert">
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Select Card */}
          <div className="form-group">
            <label className="form-label">
              Credit Card <span className="required-star">*</span>
            </label>

            {selectedCard ? (
              <div className="selected-card-banner">
                <div className="selected-card-info">
                  <span className="selected-bank">{getBankName(selectedCard)}</span>
                  <strong className="selected-name">{selectedCard.name || 'Credit Card'}</strong>
                </div>
                <button
                  type="button"
                  className="btn-change-selection"
                  onClick={() => {
                    setSelectedCardId('')
                    setSearchQuery('')
                  }}
                >
                  Change Card
                </button>
              </div>
            ) : (
              <div className="card-picker-wrapper">
                <div className="search-input-box">
                  <svg
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    className="search-icon"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by bank or card name (e.g., HDFC, Regalia)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="modal-search-input"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="catalog-list" role="listbox" aria-label="Available credit cards">
                  {catalogLoading ? (
                    <div className="catalog-status">
                      <span className="btn-spinner dark" />
                      <span>Loading available cards…</span>
                    </div>
                  ) : catalogError ? (
                    <div className="catalog-status error">{catalogError}</div>
                  ) : filteredCards.length === 0 ? (
                    <div className="catalog-status">
                      No cards matching &quot;{searchQuery}&quot; found.
                    </div>
                  ) : (
                    filteredCards.map((card) => {
                      const bank = getBankName(card)
                      return (
                        <button
                          key={card.id}
                          type="button"
                          className="catalog-item"
                          onClick={() => setSelectedCardId(card.id)}
                          role="option"
                          aria-selected={selectedCardId === card.id}
                        >
                          <div className="catalog-item-text">
                            <span className="catalog-item-bank">{bank}</span>
                            <span className="catalog-item-name">{card.name || 'Credit Card'}</span>
                          </div>
                          {card.network && (
                            <span className="catalog-network-tag">{card.network}</span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Optional Nickname */}
          <div className="form-group">
            <label htmlFor="card-display-name" className="form-label">
              Card Nickname <span className="optional-tag">(Optional)</span>
            </label>
            <input
              id="card-display-name"
              type="text"
              placeholder="e.g., Everyday Spender, Travel Card"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="modal-input"
              maxLength={40}
            />
          </div>

          {/* Section 3: Credit Limit with INR Preview */}
          <div className="form-group">
            <label htmlFor="card-credit-limit" className="form-label">
              Credit Limit <span className="optional-tag">(Optional)</span>
            </label>
            <div className="currency-input-wrapper">
              <span className="currency-prefix">₹</span>
              <input
                id="card-credit-limit"
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
            <span className="input-hint">Your approved credit line for this card.</span>
          </div>

          {/* Section 4: Statement Day & Payment Due Day */}
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="card-statement-day" className="form-label">
                Statement Day <span className="optional-tag">(1–31)</span>
              </label>
              <input
                id="card-statement-day"
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
              <span className="input-hint">Day the billing cycle closes</span>
            </div>

            <div className="form-group">
              <div className="label-with-action">
                <label htmlFor="card-due-day" className="form-label">
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
                id="card-due-day"
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
              <span className="input-hint">Day payment is due</span>
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
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={submitting || !selectedCardId}
            >
              {submitting ? (
                <>
                  <span className="btn-spinner" />
                  Linking Card…
                </>
              ) : (
                'Add to Wallet'
              )}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
