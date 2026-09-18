'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'

export interface MasterCardOption {
  id: string
  name: string
  bank?:
    | {
        id?: string
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

function formatPan(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function detectCardBrand(digits: string): string {
  const clean = digits.replace(/\D/g, '')
  if (/^4/.test(clean)) return 'visa'
  if (/^3[47]/.test(clean)) return 'amex'
  if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/.test(clean)) return 'mastercard'
  if (/^(60|65|81|82|508|50|36|38|39|63)/.test(clean)) return 'rupay'
  if (/^6(?:011|5|4[4-9]|22)/.test(clean)) return 'discover'
  return ''
}

function isValidLuhn(digits: string): boolean {
  const clean = digits.replace(/\D/g, '')
  if (!/^\d{12,19}$/.test(clean)) return false
  let sum = 0
  let double = false
  for (let i = clean.length - 1; i >= 0; i--) {
    let d = clean.charCodeAt(i) - 48
    if (double) {
      d *= 2
      if (d >= 10) d -= 9
    }
    sum += d
    double = !double
  }
  return sum % 10 === 0
}

const currentYear = new Date().getFullYear()
const EXPIRY_YEARS = Array.from({ length: 16 }, (_, i) => currentYear + i)
const EXPIRY_MONTHS = [
  { label: '01 - Jan', value: '1' },
  { label: '02 - Feb', value: '2' },
  { label: '03 - Mar', value: '3' },
  { label: '04 - Apr', value: '4' },
  { label: '05 - May', value: '5' },
  { label: '06 - Jun', value: '6' },
  { label: '07 - Jul', value: '7' },
  { label: '08 - Aug', value: '8' },
  { label: '09 - Sep', value: '9' },
  { label: '10 - Oct', value: '10' },
  { label: '11 - Nov', value: '11' },
  { label: '12 - Dec', value: '12' },
]

export default function AddCardModal({ isOpen, onClose, onCardAdded }: AddCardModalProps) {
  const [catalog, setCatalog] = useState<MasterCardOption[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  // Wallet Metadata Form State
  const [selectedCardId, setSelectedCardId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [creditLimitRaw, setCreditLimitRaw] = useState('')
  const [statementDay, setStatementDay] = useState<number | ''>('')
  const [paymentDueDay, setPaymentDueDay] = useState<number | ''>('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Secure Physical Card Vault State (Optional)
  const [saveToVault, setSaveToVault] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')

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
      setSaveToVault(false)
      setCardNumber('')
      setCardholderName('')
      setExpiryMonth('')
      setExpiryYear('')
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

  // PAN change with automatic spacing
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatPan(e.target.value))
  }

  // Detected brand from PAN
  const detectedBrand = useMemo(() => detectCardBrand(cardNumber), [cardNumber])

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

    // Vault validation if saveToVault is active
    const cleanPan = cardNumber.replace(/\D/g, '')
    if (saveToVault) {
      if (!cleanPan) {
        setFormError('Please enter your card number to save it in the vault.')
        return
      }
      if (!isValidLuhn(cleanPan)) {
        setFormError('The card number is invalid. Please double-check the digits.')
        return
      }
      if (!cardholderName.trim()) {
        setFormError('Please enter the name on the card.')
        return
      }
      const expM = parseInt(expiryMonth, 10)
      const expY = parseInt(expiryYear, 10)
      if (isNaN(expM) || expM < 1 || expM > 12) {
        setFormError('Please select a valid expiry month.')
        return
      }
      const now = new Date()
      const curYear = now.getFullYear()
      const curMonth = now.getMonth() + 1
      if (isNaN(expY) || expY < curYear || (expY === curYear && expM < curMonth)) {
        setFormError('The card expiration date must be in the future.')
        return
      }
    }

    setSubmitting(true)

    try {
      let physicalCardId: string | null = null

      // Step 1: If vault is enabled, securely encrypt & store in Cards vault
      if (saveToVault) {
        const vaultPayload: Record<string, unknown> = {
          cardNumber: cleanPan,
          cardholderName: cardholderName.trim(),
          expiryMonth: parseInt(expiryMonth, 10),
          expiryYear: parseInt(expiryYear, 10),
        }

        const bId =
          typeof selectedCard?.bank === 'object' && selectedCard?.bank && 'id' in selectedCard.bank
            ? (selectedCard.bank as { id: string }).id
            : typeof selectedCard?.bank === 'string'
              ? selectedCard.bank
              : null
        if (bId) vaultPayload.bank = bId
        if (selectedCard?.cardType) vaultPayload.cardType = selectedCard.cardType
        if (displayName.trim()) vaultPayload.nickname = displayName.trim()

        const vaultRes = await fetch('/api/cards/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(vaultPayload),
        })

        const vaultData = await vaultRes.json().catch(() => ({}))
        if (!vaultRes.ok) {
          throw new Error(vaultData.error || 'Failed to securely store card in vault.')
        }

        physicalCardId = vaultData.card?.id ?? null
      }

      // Step 2: Create UserCard wallet entry (linked to physicalCard if created)
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
      if (physicalCardId) {
        payload.physicalCard = physicalCardId
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
              Select a card from the catalog, configure billing details, and optionally vault your physical card.
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

          {/* Section 5: Optional Secure Physical Card Vault */}
          <div className={`vault-toggle-container ${saveToVault ? 'active' : ''}`}>
            <div className="vault-toggle-header" onClick={() => setSaveToVault(!saveToVault)}>
              <div className="vault-checkbox-wrap">
                <input
                  type="checkbox"
                  id="save-to-vault-toggle"
                  checked={saveToVault}
                  onChange={(e) => setSaveToVault(e.target.checked)}
                  className="vault-checkbox"
                  onClick={(e) => e.stopPropagation()}
                />
                <label
                  htmlFor="save-to-vault-toggle"
                  className="vault-toggle-label"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="vault-title">Store Card Number in Secure Vault</span>
                  <span className="vault-sub">Hardware-grade AES-256-GCM encryption & masked view</span>
                </label>
              </div>
              <span className="vault-security-pill">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                AES-256
              </span>
            </div>

            {saveToVault && (
              <div className="vault-fields-body">
                <div className="form-group">
                  <label htmlFor="vault-card-number" className="form-label">
                    Card Number (PAN) <span className="required-star">*</span>
                  </label>
                  <div className="pan-input-wrapper">
                    <input
                      id="vault-card-number"
                      type="text"
                      inputMode="numeric"
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="modal-input pan-input"
                      maxLength={23}
                      autoComplete="cc-number"
                    />
                    {detectedBrand && (
                      <span className={`brand-badge ${detectedBrand}`}>
                        {detectedBrand.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="vault-cardholder-name" className="form-label">
                    Name on Card <span className="required-star">*</span>
                  </label>
                  <input
                    id="vault-cardholder-name"
                    type="text"
                    placeholder="e.g., ADITYA SHARMA"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                    className="modal-input"
                    maxLength={60}
                    autoComplete="cc-name"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="vault-expiry-month" className="form-label">
                      Expiry Month <span className="required-star">*</span>
                    </label>
                    <select
                      id="vault-expiry-month"
                      value={expiryMonth}
                      onChange={(e) => setExpiryMonth(e.target.value)}
                      className="modal-input modal-select"
                    >
                      <option value="">Month</option>
                      {EXPIRY_MONTHS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="vault-expiry-year" className="form-label">
                      Expiry Year <span className="required-star">*</span>
                    </label>
                    <select
                      id="vault-expiry-year"
                      value={expiryYear}
                      onChange={(e) => setExpiryYear(e.target.value)}
                      className="modal-input modal-select"
                    >
                      <option value="">Year</option>
                      {EXPIRY_YEARS.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="vault-assurance-note">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>
                    Zero CVV policy. Sensitive card numbers are encrypted before reaching the database. Plaintext PAN is never saved.
                  </span>
                </div>
              </div>
            )}
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
                  {saveToVault ? 'Encrypting & Linking…' : 'Linking Card…'}
                </>
              ) : saveToVault ? (
                'Save & Encrypt Card'
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
