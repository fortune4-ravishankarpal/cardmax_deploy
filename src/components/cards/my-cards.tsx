'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import styles from './my-cards.module.scss'

/**
 * My Cards — frontend for the secure card vault.
 *
 * PCI safety rules implemented here:
 * - Only masked PANs (`panMasked`) are ever fetched/rendered for the list.
 * - The full PAN is requested ONLY through an authenticated API call
 *   (`POST /api/cards/:id/reveal`) and kept in React state for a short,
 *   fixed window before being cleared automatically.
 * - The full PAN is never written to localStorage/sessionStorage, never placed
 *   in URLs, never sent to analytics, and never logged.
 * - Revealing one card clears any previously revealed card.
 */

interface CardView {
  id: string
  nickname?: string | null
  brand?: string | null
  panMasked?: string | null
  expiryMonth?: number | null
  expiryYear?: number | null
}

interface RevealData {
  id: string
  pan: string
  cardholderName: string
  expiryMonth: number | null
  expiryYear: number | null
}

interface CardResponse {
  ok?: boolean
  error?: string
  code?: string
  card?: CardView
  matches?: CardView[]
  data?: RevealData
}

const REVEAL_CLEAR_MS = 20_000

const brandLabel = (brand: string | null | undefined): string => {
  switch (brand) {
    case 'visa':
      return 'Visa'
    case 'mastercard':
      return 'Mastercard'
    case 'amex':
      return 'American Express'
    case 'rupay':
      return 'RuPay'
    default:
      return ''
  }
}

const postJson = async (url: string, body: unknown): Promise<CardResponse> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json().catch(() => ({}))) as CardResponse
}

export const MyCards = () => {
  const [cards, setCards] = useState<CardView[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Add-card form state — the PAN lives in form state only while entering it.
  const [cardNumber, setCardNumber] = useState('')
  const [cardholderName, setCardholderName] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [saving, setSaving] = useState(false)

  // Revealed full PAN — kept only as long as the caller explicitly needs it.
  const [revealed, setRevealed] = useState<RevealData | null>(null)
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearRevealed = useCallback(() => {
    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current)
      clearTimerRef.current = null
    }
    setRevealed(null)
  }, [])

  // Auto-clear the revealed PAN after a fixed window.
  useEffect(() => {
    if (revealed) {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
      clearTimerRef.current = setTimeout(clearRevealed, REVEAL_CLEAR_MS)
    }
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current)
    }
  }, [revealed, clearRevealed])

  const loadCards = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/cards?limit=100&sort=-updatedAt')
      const data = (await res.json()) as { docs?: CardView[] }
      setCards(data.docs ?? [])
    } catch {
      setError('Could not load your cards.')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCards()
  }, [loadCards])

  const handleAdd = async () => {
    setError('')
    setNotice('')
    const month = Number(expiryMonth)
    const year = Number(expiryYear)
    try {
      setSaving(true)
      const data = await postJson('/api/cards/add', {
        pan: cardNumber,
        cardholderName,
        expiryMonth: month,
        expiryYear: year,
      })
      if (data.error) {
        setError(data.error)
        return
      }
      setCardNumber('')
      setCardholderName('')
      setExpiryMonth('')
      setExpiryYear('')
      setNotice('Card saved. Only the last four digits are stored in clear text.')
      await loadCards(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleReveal = async (id: string) => {
    setError('')
    setNotice('')
    clearRevealed()
    setRevealingId(id)
    try {
      const data = await postJson(`/api/cards/${encodeURIComponent(id)}/reveal`, {})
      if (data.error) {
        setError(data.error)
        return
      }
      if (data.data) setRevealed(data.data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setRevealingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this card? The encrypted card data will be permanently removed.')) return
    setError('')
    setNotice('')
    clearRevealed()
    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(data.error || 'Could not delete the card.')
        return
      }
      setNotice('Card deleted.')
      await loadCards(true)
    } catch {
      setError('Network error. Please try again.')
    }
  }
return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Cards</h1>
      <p className={styles.subtitle}>
        Your card numbers are encrypted at rest and are never shown in full unless you explicitly reveal them.
      </p>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className={styles.notice} role="status">
          {notice}
        </div>
      )}

      <section className={styles.section} aria-label="Add a card">
        <h2 className={styles.sectionTitle}>Add a card</h2>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault()
            handleAdd()
          }}
        >
          <label className={styles.field}>
            <span>Card number</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              className={styles.input}
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="1234 5678 9012 3456"
              required
            />
          </label>
          <label className={styles.field}>
            <span>Cardholder name</span>
            <input
              type="text"
              autoComplete="cc-name"
              className={styles.input}
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              required
            />
          </label>
          <div className={styles.row}>
            <label className={styles.field}>
              <span>Expiry month</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                className={styles.input}
                value={expiryMonth}
                onChange={(e) => setExpiryMonth(e.target.value)}
                placeholder="MM"
                required
              />
            </label>
            <label className={styles.field}>
              <span>Expiry year</span>
              <input
                type="number"
                inputMode="numeric"
                min={2000}
                max={2199}
                className={styles.input}
                value={expiryYear}
                onChange={(e) => setExpiryYear(e.target.value)}
                placeholder="YYYY"
                required
              />
            </label>
          </div>
          <button type="submit" className={styles.primaryButton} disabled={saving}>
            {saving ? 'Saving…' : 'Save card'}
          </button>
        </form>
      </section>

      <section className={styles.section} aria-label="Saved cards">
        <h2 className={styles.sectionTitle}>Saved cards</h2>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : cards.length === 0 ? (
          <p className={styles.muted}>No cards saved yet.</p>
        ) : (
          <ul className={styles.list}>
            {cards.map((card) => (
              <li key={card.id} className={styles.cardItem}>
                <div className={styles.cardMeta}>
                  <span className={styles.cardNumber}>{card.panMasked || '•••• •••• •••• ••••'}</span>
                  {card.nickname && <span className={styles.cardNickname}>{card.nickname}</span>}
                  <span className={styles.cardDetails}>
                    {brandLabel(card.brand)}
                    {card.expiryMonth && card.expiryYear
                      ? ` · Expires ${String(card.expiryMonth).padStart(2, '0')}/${card.expiryYear}`
                      : ''}
                  </span>
                  {revealed?.id === card.id && (
                    <div className={styles.revealedBox}>
                      <p className={styles.revealedPan}>{revealed.pan}</p>
                      <p className={styles.revealedName}>
                        {revealed.cardholderName} · Expires{' '}
                        {String(revealed.expiryMonth ?? '').padStart(2, '0')}/{revealed.expiryYear ?? ''}
                      </p>
                      <p className={styles.revealedHint}>Auto-hidden after 20 seconds. Do not share this number.</p>
                    </div>
                  )}
                </div>
                <div className={styles.cardActions}>
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    onClick={() => handleReveal(card.id)}
                    disabled={revealingId === card.id}
                  >
                    {revealed?.id === card.id
                      ? 'Hide number'
                      : revealingId === card.id
                        ? 'Revealing…'
                        : 'Show full number'}
                  </button>
                  <button type="button" className={styles.dangerButton} onClick={() => handleDelete(card.id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}