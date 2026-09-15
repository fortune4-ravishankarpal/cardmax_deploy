'use client'

import React from 'react'
import Link from 'next/link'

export interface DashboardData {
  user: {
    name: string
    email: string
    isPro: boolean
  }
  metrics: {
    totalCards: number
    activeCardsCount: number
    totalCreditLimit: number
    nextDue: {
      cardName?: string
      dueDateFormatted?: string
      daysRemaining?: number
      hasUpcomingDue: boolean
    }
  }
  gmailConnected: boolean
  recommendations: Array<{
    category: string
    icon: string
    bestCard: string
    multiplier: string
    perkSummary: string
    isOwned: boolean
  }>
  recentStatementsCount: number
}

export const DashboardView: React.FC<{ data: DashboardData }> = ({ data }) => {
  const { user, metrics, gmailConnected, recommendations } = data

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="cm-home-wrapper">
      <div className="cm-container">
        {/* Dashboard Header */}
        <header className="cm-dashboard-header">
          <div className="cm-greeting">
            <h1>Welcome back, {user.name}</h1>
            <p>{todayFormatted} &bull; Your CardMax Financial Overview</p>
          </div>
        </header>

        {/* 3-Card Metrics Grid */}
        <section className="cm-metrics-grid" aria-label="Wallet Overview Metrics">
          {/* Card 1: Active Cards */}
          <div className="cm-metric-card cm-metric-card--primary">
            <div className="cm-metric-card__header">
              <span>Active Cards</span>
              <div className="cm-metric-icon cm-metric-icon--blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="3" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                  <line x1="6" x2="10" y1="15" y2="15" />
                </svg>
              </div>
            </div>
            <div className="cm-metric-value">{metrics.activeCardsCount}</div>
            <div className="cm-metric-subtext">
              <span>{metrics.totalCards} cards linked in wallet</span>
            </div>
          </div>

          {/* Card 2: Total Credit Limit */}
          <div className="cm-metric-card cm-metric-card--success">
            <div className="cm-metric-card__header">
              <span>Total Credit Limit</span>
              <div className="cm-metric-icon cm-metric-icon--green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" x2="12" y1="2" y2="22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <div className="cm-metric-value">
              {metrics.totalCreditLimit > 0 ? formatCurrency(metrics.totalCreditLimit) : '₹0'}
            </div>
            <div className="cm-metric-subtext">
              <span>Aggregate purchasing capacity</span>
            </div>
          </div>

          {/* Card 3: Next Payment Due */}
          <div className="cm-metric-card cm-metric-card--warning">
            <div className="cm-metric-card__header">
              <span>Next Statement Due</span>
              <div className="cm-metric-icon cm-metric-icon--amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <div className="cm-metric-value">
              {metrics.nextDue.hasUpcomingDue
                ? `${metrics.nextDue.daysRemaining} days`
                : 'No Dues'}
            </div>
            <div className="cm-metric-subtext">
              {metrics.nextDue.hasUpcomingDue ? (
                <>
                  <span className={`cm-badge-status ${metrics.nextDue.daysRemaining! <= 3 ? 'cm-badge-status--urgent' : 'cm-badge-status--good'}`}>
                    {metrics.nextDue.dueDateFormatted}
                  </span>
                  <span>&bull; {metrics.nextDue.cardName}</span>
                </>
              ) : (
                <span>All statement payments clear</span>
              )}
            </div>
          </div>
        </section>

        {/* Quick Actions Bar */}
        <section aria-label="Quick Actions">
          <div className="cm-section-title">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Quick Actions
            </h2>
          </div>

          <div className="cm-quick-actions-bar">
            <Link href="/wallet" className="cm-quick-action-btn">
              <div className="cm-action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="cm-action-text">
                <span>Add New Card</span>
                <span>Link card to wallet</span>
              </div>
            </Link>

            <Link href="/wallet" className="cm-quick-action-btn">
              <div className="cm-action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="3" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <div className="cm-action-text">
                <span>Manage Wallet</span>
                <span>View {metrics.activeCardsCount} active cards</span>
              </div>
            </Link>

            <Link href="/gmail" className="cm-quick-action-btn">
              <div className="cm-action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h9" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="cm-action-text">
                <span>Gmail Statements</span>
                <span>{gmailConnected ? 'Connected & synced' : 'Connect auto-sync'}</span>
              </div>
            </Link>

            <Link href="/settings/consent" className="cm-quick-action-btn">
              <div className="cm-action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
              </div>
              <div className="cm-action-text">
                <span>Consent Settings</span>
                <span>Privacy & permissions</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Body Grid: Recommendations + Max Pro Banner */}
        <section className="cm-dashboard-body-grid">
          {/* Recommendations Widget */}
          <div className="cm-recommendations-widget">
            <div className="cm-widget-header">
              <div className="cm-widget-title">
                <h3>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                  </svg>
                  Best Card to Use This Month
                </h3>
                <p>Maximize your reward multipliers and cashback across everyday spending categories</p>
              </div>
              <span className="cm-month-pill">Active Boosts</span>
            </div>

            <div className="cm-categories-grid">
              {recommendations.map((rec) => (
                <div key={rec.category} className="cm-category-card">
                  <div className="cm-cat-top">
                    <span className="cm-cat-title">
                      <span>{rec.icon}</span>
                      <span>{rec.category}</span>
                    </span>
                    <span className="cm-cat-multiplier">{rec.multiplier}</span>
                  </div>

                  <div className="cm-cat-card-name">{rec.bestCard}</div>
                  <div className="cm-cat-perk">{rec.perkSummary}</div>

                  <div className={`cm-cat-status ${rec.isOwned ? 'cm-cat-status--owned' : ''}`}>
                    {rec.isOwned ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span>In Your Wallet</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" x2="12" y1="8" y2="12" />
                          <line x1="12" x2="12.01" y1="16" y2="16" />
                        </svg>
                        <span>Recommended Pick</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
