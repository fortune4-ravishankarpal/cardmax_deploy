'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AddCardModal from './components/AddCardModal'
import EditCardModal from './components/EditCardModal'
import ShowMeTheMathsModal, { type RecommendationMathData } from '../components/Dashboard/ShowMeTheMathsModal'
import type { BestCardByCategoryItem } from '@/app/api/cards/best-by-category/route'
import './styles.scss'

// Category icon + display name mapping
const CATEGORY_META: Record<string, { icon: string; label: string; multiplierFallback: string }> = {
  'dining-and-delivery': { icon: '🍽️', label: 'Dining & Delivery', multiplierFallback: 'Dining Rewards' },
  'dining':              { icon: '🍽️', label: 'Dining & Delivery', multiplierFallback: 'Dining Rewards' },
  'dinning':             { icon: '🍽️', label: 'Dining & Delivery', multiplierFallback: 'Dining Rewards' },
  'travel':              { icon: '✈️', label: 'Travel & Flights',  multiplierFallback: 'Travel Miles' },
  'travel-and-flights':  { icon: '✈️', label: 'Travel & Flights',  multiplierFallback: 'Travel Miles' },
  'fuel':                { icon: '⛽', label: 'Fuel Surcharge',    multiplierFallback: 'Fuel Waiver' },
  'fuel-surcharge':      { icon: '⛽', label: 'Fuel Surcharge',    multiplierFallback: 'Fuel Waiver' },
  'shopping':            { icon: '🛍️', label: 'Online Shopping',   multiplierFallback: 'Cashback' },
  'online-shopping':     { icon: '🛍️', label: 'Online Shopping',   multiplierFallback: 'Cashback' },
  'grocery':             { icon: '🥦', label: 'Grocery & Spends',   multiplierFallback: 'Cashback' },
  'groceries':           { icon: '🥦', label: 'Grocery & Spends',   multiplierFallback: 'Cashback' },
  'utilities':           { icon: '⚡', label: 'Utilities & Bills', multiplierFallback: 'Cashback' },
  'utility-bills':       { icon: '⚡', label: 'Utilities & Bills', multiplierFallback: 'Cashback' },
  'entertainment':       { icon: '🍿', label: 'Movies & Events',   multiplierFallback: 'BOGO Offer' },
}

function getMultiplierLabel(item: BestCardByCategoryItem): string {
  if (item.isCashback && item.cashbackPercent > 0) return `${item.cashbackPercent}% Cashback`
  if (!item.isCashback && item.rewardPointsPer100 > 0) return `${item.rewardPointsPer100}X Points`
  return CATEGORY_META[item.categorySlug]?.multiplierFallback ?? 'Rewards'
}

// Static fallback if API returns nothing
const STATIC_FALLBACK: RecommendationMathData[] = [
  { category: 'Dining & Delivery', icon: '🍽️', bestCard: 'HDFC Swiggy Credit Card', multiplier: '10% Cashback' },
  { category: 'Travel & Flights',  icon: '✈️', bestCard: 'Axis Atlas Credit Card',  multiplier: '5X Miles' },
  { category: 'Fuel Surcharge',    icon: '⛽', bestCard: 'BPCL SBI Octane',         multiplier: '25X Points' },
  { category: 'Online Shopping',   icon: '🛍️', bestCard: 'SBI Cashback Credit Card', multiplier: '5% Cashback' },
]

export default function WalletPage() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<any | null>(null)
  const [activeMathRec, setActiveMathRec] = useState<RecommendationMathData | null>(null)

  // Live category tiles from API
  const [recTiles, setRecTiles] = useState<RecommendationMathData[]>([])
  const [recLoading, setRecLoading] = useState(true)
  const [recSource, setRecSource] = useState<'live' | 'static'>('static')


  const fetchCards = useCallback(async () => {
    try {
      const res = await fetch('/api/user-cards/me')

      if (res.ok) {
        const data = await res.json()
        setCards(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCards()
  }, [fetchCards])

  // Fetch live category tiles from Payload DB
  useEffect(() => {
    fetch('/api/cards/best-by-category')
      .then((r) => r.json())
      .then((data: BestCardByCategoryItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const tiles: RecommendationMathData[] = data.map((item) => {
            const meta = CATEGORY_META[item.categorySlug]
            return {
              category: meta?.label ?? item.category,
              categorySlug: item.categorySlug,
              cardName: item.cardName,
              icon: meta?.icon ?? '💳',
              bestCard: item.cardName,
              multiplier: getMultiplierLabel(item),
            }
          })
          setRecTiles(tiles)
          setRecSource('live')
        } else {
          // API returned empty — no cards in DB with categories set yet
          setRecTiles(STATIC_FALLBACK)
          setRecSource('static')
        }
      })
      .catch(() => {
        setRecTiles(STATIC_FALLBACK)
        setRecSource('static')
      })
      .finally(() => setRecLoading(false))
  }, [])

  const deactivateCard = async (id: string) => {
    if (!confirm('Are you sure you want to remove this card from your wallet?')) return
    try {
      const res = await fetch(`/api/user-cards/${id}/deactivate`, { method: 'POST' })
      if (res.ok) {
        fetchCards()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const activeCardsCount = cards.filter((c) => c.status === 'active').length

  return (
    <div className="wallet-page-wrapper">
      <div className="wallet-container">
        {/* Navigation / Header */}
        <div className="wallet-breadcrumb">
          <Link href="/" className="btn-back">
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <header className="wallet-header">
          <div className="header-text">
            <h1>My Credit Cards</h1>
            <p>Manage your linked credit cards, statement dates, and reward limits.</p>
          </div>
          <button
            type="button"
            className="btn-add"
            onClick={() => setIsAddModalOpen(true)}
            id="btn-add-card"
          >
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Card
          </button>
        </header>

        {/* Overview Stats Bar */}
        {!loading && cards.length > 0 && (
          <section className="wallet-stats-bar" aria-label="Wallet Overview">
            <div className="stat-item">
              <span className="stat-label">Total Cards</span>
              <span className="stat-val">{cards.length}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-label">Active Cards</span>
              <span className="stat-val">{activeCardsCount}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-label">Wallet Status</span>
              <span className="stat-val status-good">Optimized</span>
            </div>
          </section>
        )}

        {/* Content Area */}
        {loading ? (
          <div className="wallet-loading">
            <span className="loading-spinner" />
            <p>Loading your cards…</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon" aria-hidden="true">
              <svg
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <h3>Your wallet is empty</h3>
            <p>Add a credit card to track rewards, statement dates, and personalized card perks.</p>
            <button type="button" className="btn-add" onClick={() => setIsAddModalOpen(true)}>
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Card
            </button>
          </div>
        ) : (
          <div className="card-grid">
            {cards.map((card) => {
              const isActive = card.status === 'active'

              const cardObj =
                typeof card.card === 'object' && card.card
                  ? card.card
                  : typeof card.creditCard === 'object' && card.creditCard
                    ? card.creditCard
                    : null

              const bankName =
                (typeof cardObj?.bank === 'object' && cardObj.bank?.name) ||
                (typeof cardObj?.bank === 'string' && cardObj.bank) ||
                card.bankName ||
                'Bank'

              const cardName = cardObj?.name || card.cardName || 'Credit Card'
              const displayName = card.displayName || null
              const dueDay = card.paymentDueDay ?? card.billingCycleDay ?? null

              return (
                <article key={card.id} className={`wallet-card ${!isActive ? 'inactive' : ''}`}>
                  <div className="card-top">
                    <div className="card-branding">
                      <span className="bank-name">{bankName}</span>
                      <h2 className="card-name">{displayName || cardName}</h2>
                      {displayName && <span className="card-subtitle-type">{cardName}</span>}
                    </div>
                    <span className={`badge ${isActive ? 'status-active' : 'status-inactive'}`}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="card-details-grid">
                    {card.creditLimit != null && (
                      <div className="detail-item">
                        <span className="detail-label">Credit Limit</span>
                        <span className="detail-value">
                          ₹{Number(card.creditLimit).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                    {card.statementDay != null && (
                      <div className="detail-item">
                        <span className="detail-label">Statement Day</span>
                        <span className="detail-value">{card.statementDay}th of month</span>
                      </div>
                    )}
                    {dueDay != null && (
                      <div className="detail-item">
                        <span className="detail-label">Payment Due</span>
                        <span className="detail-value">{dueDay}th of month</span>
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    <button
                      type="button"
                      className="btn-card-action secondary"
                      onClick={() => setEditingCard(card)}
                      id={`btn-edit-card-${card.id}`}
                    >
                      <svg
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      Edit
                    </button>
                    {isActive && (
                      <button
                        type="button"
                        className="btn-card-action danger"
                        onClick={() => deactivateCard(card.id)}
                        id={`btn-remove-card-${card.id}`}
                      >
                        <svg
                          width="13"
                          height="13"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Remove
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* ── Reward Recommendations Widget ──────────────────────────── */}
        <section className="wallet-recommendations-section">
          <div className="wallet-rec-header">
            <div>
              <h2 className="wallet-rec-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                Best Card by Category
                {!recLoading && (
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700, marginLeft: 8,
                    padding: '0.12rem 0.45rem', borderRadius: 4,
                    background: recSource === 'live' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                    color: recSource === 'live' ? '#15803d' : '#b45309',
                  }}>
                    {recSource === 'live' ? '● Live from DB' : '● Static data'}
                  </span>
                )}
              </h2>
              <p className="wallet-rec-subtitle">See the exact maths behind each card recommendation</p>
            </div>
          </div>

          {recLoading ? (
            <div className="wallet-rec-grid">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="wallet-rec-card" style={{ minHeight: 100 }}>
                  <div style={{ height: 12, width: '60%', borderRadius: 6, background: 'rgba(108,76,241,0.1)', marginBottom: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <div style={{ height: 16, width: '80%', borderRadius: 6, background: 'rgba(108,76,241,0.07)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
                </div>
              ))}
            </div>
          ) : (
            <div className="wallet-rec-grid">
              {recTiles.map((rec) => (
                <div key={rec.category} className="wallet-rec-card">
                  <div className="wallet-rec-card__top">
                    <span className="wallet-rec-card__icon">{rec.icon}</span>
                    <span className="wallet-rec-card__category">{rec.category}</span>
                    <span className="wallet-rec-card__multiplier">{rec.multiplier}</span>
                  </div>
                  <div className="wallet-rec-card__name">{rec.bestCard}</div>
                  <button
                    className="wallet-show-maths-btn"
                    id={`wallet-show-maths-${rec.category.replace(/\s+/g, '-').replace(/&/g, 'and').toLowerCase()}`}
                    onClick={() => setActiveMathRec(rec)}
                    aria-label={`Show the maths behind ${rec.category} recommendation`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <line x1="8" y1="6" x2="16" y2="6" />
                      <line x1="8" y1="10" x2="10" y2="10" />
                      <line x1="14" y1="10" x2="16" y2="10" />
                      <line x1="8" y1="14" x2="10" y2="14" />
                      <line x1="14" y1="14" x2="16" y2="14" />
                      <line x1="8" y1="18" x2="10" y2="18" />
                      <line x1="14" y1="18" x2="16" y2="18" />
                    </svg>
                    Show Me the Maths →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>{/* end wallet-container */}

      {/* Interactive Modals */}
      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCardAdded={fetchCards}
      />

      <EditCardModal
        isOpen={Boolean(editingCard)}
        card={editingCard}
        onClose={() => setEditingCard(null)}
        onCardUpdated={fetchCards}
      />

      {/* Show Me the Maths Modal */}
      {activeMathRec && (
        <ShowMeTheMathsModal
          recommendation={activeMathRec}
          onClose={() => setActiveMathRec(null)}
        />
      )}
    </div>
  )
}
