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

    fetch('/api/track', {
      method: 'POST',
      body: JSON.stringify({
        event: 'checkout_button_clicked',
        category: 'monetization',
        properties: { planId: selectedPlanId },
        url: window.location.pathname,
      }),
    }).catch(() => {})

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
        <div className="header">
          <h1>Complete Your Subscription</h1>
          <p className="subtitle">Choose a plan to start your free trial for CardMax Pro.</p>
        </div>

        {fetchingPlans ? (
          <div className="loading-state">Loading plans...</div>
        ) : plans.length > 0 ? (
          <>
            <div className="plan-selection">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.id
                return (
                  <div
                    key={plan.id}
                    className={`plan-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <div className="plan-card-header">
                      <h3>
                        {plan.name} <span className="interval">({plan.billingInterval})</span>
                      </h3>
                      <span className="price">
                        {plan.currency === 'INR' ? '₹' : '$'}
                        {plan.price}
                      </span>
                    </div>
                    {plan.description && <p className="plan-description">{plan.description}</p>}
                  </div>
                )
              })}
            </div>

            {selectedPlan && (
              <div className="order-summary">
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
                  <div className="summary-row trial">
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
            >
              {loading ? 'Processing...' : 'Proceed to Payment Setup'}
            </button>

            <p className="disclaimer">
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
