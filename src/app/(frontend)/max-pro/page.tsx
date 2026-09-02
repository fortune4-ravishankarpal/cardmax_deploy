import React from 'react'
import './styles.scss'
import Link from 'next/link'

export default function MaxProLandingPage() {
  return (
    <div className="max-pro-landing">
      <header className="max-pro-header">
        <h1>CardMax <span className="pro-badge">PRO</span></h1>
        <p>Unlock the ultimate credit card intelligence platform.</p>
      </header>
      
      <section className="features">
        <div className="feature-card">
          <h3>Real-time Alerts</h3>
          <p>Get notified instantly when your cards are devalued.</p>
        </div>
        <div className="feature-card">
          <h3>Target Tracking</h3>
          <p>Track your spend towards milestone bonuses and fee waivers automatically.</p>
        </div>
        <div className="feature-card">
          <h3>Inbox Intelligence</h3>
          <p>Automatically ingest statements and find missing rewards.</p>
        </div>
      </section>

      <section className="pricing">
        <h2>₹499 / year</h2>
        <p>Includes a 7-day free trial. Cancel anytime.</p>
        <Link href="/max-pro/checkout" className="btn-primary">
          Start Free Trial
        </Link>
      </section>
    </div>
  )
}
