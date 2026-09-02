'use client'

import React, { useState, useEffect } from 'react'
import './styles.scss'

export default function WalletPage() {
  const [cards, setCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCards()
  }, [])

  const fetchCards = async () => {
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
  }

  const deactivateCard = async (id: string) => {
    if (!confirm('Are you sure you want to remove this card from your wallet?')) return
    try {
      const res = await fetch(`/api/user-cards/${id}/deactivate`, { method: 'POST' })
      if (res.ok) fetchCards()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="wallet-page">
      <header className="wallet-header">
        <h1>My Wallet</h1>
        <button className="btn-add">Add Card</button>
      </header>

      {loading ? (
        <p>Loading your cards...</p>
      ) : cards.length === 0 ? (
        <div className="empty-state">
          <p>Your wallet is empty. Add a credit card to start tracking your rewards and spending.</p>
        </div>
      ) : (
        <div className="card-grid">
          {cards.map(card => (
            <div key={card.id} className={`wallet-card ${card.status !== 'active' ? 'inactive' : ''}`}>
              <div className="card-branding">
                <div className="bank-name">{card.creditCard?.bank?.name || 'Bank'}</div>
                <div className="card-name">{card.creditCard?.name || 'Credit Card'}</div>
              </div>
              
              <div className="card-details">
                {card.creditLimit && (
                  <div className="detail">
                    <span className="label">Limit</span>
                    <span className="value">₹{card.creditLimit.toLocaleString()}</span>
                  </div>
                )}
                {card.statementDay && (
                  <div className="detail">
                    <span className="label">Statement</span>
                    <span className="value">{card.statementDay}th</span>
                  </div>
                )}
              </div>

              <div className="card-actions">
                <button className="btn-edit">Edit</button>
                {card.status === 'active' && (
                  <button className="btn-remove" onClick={() => deactivateCard(card.id)}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
