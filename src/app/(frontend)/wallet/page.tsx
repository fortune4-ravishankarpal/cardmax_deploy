'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import AddCardModal from './components/AddCardModal'
import EditCardModal from './components/EditCardModal'
import './styles.scss'

export default function WalletPage() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<any | null>(null)

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
          <Link href="/profile" className="btn-back">
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
            Back to Profile
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
            <button
              type="button"
              className="btn-add"
              onClick={() => setIsAddModalOpen(true)}
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
      </div>

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
    </div>
  )
}

