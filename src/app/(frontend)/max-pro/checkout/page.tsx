'use client'

import React, { useState, useEffect } from 'react'
import './styles.scss'

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plans, setPlans] = useState<any[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [fetchingPlans, setFetchingPlans] = useState(true)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        // Use the custom endpoint that overrides access to bypass Payload's strict Drafts permission checks
        const res = await fetch('/api/subscription-plans/active')
        const data = await res.json()

        if (data.docs && data.docs.length > 0) {
          setPlans(data.docs)
          setSelectedPlanId(data.docs[0].id)
        } else {
          setError('No active subscription plans available.')
        }
      } catch (err) {
        setError('Failed to load subscription plans.')
      } finally {
        setFetchingPlans(false)
      }
    }
    fetchPlans()
  }, [])

  const handleCheckout = async () => {
    if (!selectedPlanId) {
      setError('Please select a plan')
      return
    }

    // Fire the analytics event
    fetch('/api/track', {
      method: 'POST',
      body: JSON.stringify({
        event: 'checkout_button_clicked',
        category: 'monetization',
        properties: { planId: selectedPlanId },
        url: window.location.pathname
      })
    }).catch(() => {}) // Catch network errors so it doesn't break checkout

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Checkout failed')
      }

      // Redirect to Razorpay hosted checkout
      if (data.shortUrl) {
        window.location.href = data.shortUrl
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1>Complete Your Subscription</h1>
        <p className="subtitle">Choose a plan to start your free trial for CardMax Pro.</p>

        {fetchingPlans ? (
          <p>Loading plans...</p>
        ) : plans.length > 0 ? (
          <>
            <div className="plan-selection">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`plan-card ${selectedPlanId === plan.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlanId(plan.id)}
                  style={{
                    padding: '1rem',
                    border: selectedPlanId === plan.id ? '2px solid #007bff' : '1px solid #444',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    backgroundColor:
                      selectedPlanId === plan.id ? 'rgba(0, 123, 255, 0.1)' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      {plan.name} ({plan.billingInterval})
                    </h3>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {plan.currency === 'INR' ? '₹' : '$'}
                      {plan.price}
                    </span>
                  </div>
                  {plan.description && (
                    <p style={{ margin: '0.5rem 0 0 0', color: '#aaa', fontSize: '0.9rem' }}>
                      {plan.description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {selectedPlan && (
              <div className="order-summary" style={{ marginTop: '2rem' }}>
                <div className="summary-row">
                  <span>
                    {selectedPlan.name} ({selectedPlan.billingInterval})
                  </span>
                  <span>
                    {selectedPlan.currency === 'INR' ? '₹' : '$'}
                    {selectedPlan.price.toFixed(2)}
                  </span>
                </div>
                {selectedPlan.trialDays > 0 && (
                  <div className="summary-row">
                    <span>Trial Discount ({selectedPlan.trialDays} Days)</span>
                    <span>
                      -{selectedPlan.currency === 'INR' ? '₹' : '$'}
                      {selectedPlan.price.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Due Today</span>
                  <span>
                    {selectedPlan.trialDays > 0
                      ? '₹0.00'
                      : `${selectedPlan.currency === 'INR' ? '₹' : '$'}${selectedPlan.price.toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button
              className="btn-checkout"
              onClick={handleCheckout}
              disabled={loading || !selectedPlanId}
              style={{ marginTop: '1.5rem', width: '100%' }}
            >
              {loading ? 'Processing...' : 'Proceed to Payment Setup'}
            </button>
            <p
              className="disclaimer"
              style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#888', textAlign: 'center' }}
            >
              A valid payment method is required to start your {selectedPlan?.trialDays || 0}-day
              trial. You will not be charged if you cancel before the trial ends.
            </p>
          </>
        ) : (
          <div className="error-message">{error || 'No active plans found.'}</div>
        )}
      </div>
    </div>
  )
}
