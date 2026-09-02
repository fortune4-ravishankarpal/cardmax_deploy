'use client'

import React, { useState, useEffect } from 'react'
import './styles.scss'

export default function SubscriptionPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch('/api/subscriptions/me')
      if (!res.ok) throw new Error('Failed to fetch subscriptions')
      const data = await res.json()
      setSubscriptions(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return
    
    try {
      const res = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: id })
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel')
      }
      
      await fetchSubscriptions()
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="subscription-page">
      <h1>My Subscriptions</h1>
      
      {error && <div className="error-message">{error}</div>}

      {subscriptions.length === 0 ? (
        <p>You don't have any active subscriptions.</p>
      ) : (
        subscriptions.map(sub => (
          <div key={sub.id} className="subscription-details">
            <span className={`status-badge ${sub.status}`}>
              {sub.status.replace('_', ' ')}
            </span>
            
            <div className="detail-row">
              <span className="label">Plan ID</span>
              <span className="value">{sub.providerSubscriptionId}</span>
            </div>
            
            <div className="detail-row">
              <span className="label">Current Period End</span>
              <span className="value">
                {new Date(sub.currentPeriodEnd).toLocaleDateString()}
              </span>
            </div>

            {sub.cancelAtPeriodEnd && (
              <div className="detail-row">
                <span className="label">Note</span>
                <span className="value">Will cancel at end of billing period</span>
              </div>
            )}

            <div className="actions" style={{ marginTop: '2rem' }}>
              {!sub.cancelAtPeriodEnd && !['canceled', 'expired'].includes(sub.status) && (
                <button 
                  className="btn btn-danger"
                  onClick={() => handleCancel(sub.id)}
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
