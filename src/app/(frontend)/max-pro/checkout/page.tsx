'use client'

import React, { useState, useEffect } from 'react'
import './styles.scss'

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCheckout = async () => {
    setLoading(true)
    setError('')
    try {
      // In a real app we would fetch the active plan ID dynamically
      const res = await fetch('/api/users/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'plan_rs499_yr' })
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

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1>Complete Your Subscription</h1>
        <p className="subtitle">You are about to start a 7-day free trial for CardMax Pro.</p>
        
        <div className="order-summary">
          <div className="summary-row">
            <span>CardMax Pro (Annual)</span>
            <span>₹499.00</span>
          </div>
          <div className="summary-row">
            <span>Trial Discount (7 Days)</span>
            <span>-₹499.00</span>
          </div>
          <div className="summary-row total">
            <span>Due Today</span>
            <span>₹0.00</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          className="btn-checkout" 
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Proceed to Payment Setup'}
        </button>
        <p className="disclaimer">
          A valid payment method is required to start your trial. You will not be charged if you cancel before the trial ends.
        </p>
      </div>
    </div>
  )
}
