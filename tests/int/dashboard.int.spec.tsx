import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { LandingView } from '@/app/(frontend)/components/Dashboard/LandingView'
import { DashboardView, type DashboardData } from '@/app/(frontend)/components/Dashboard/DashboardView'

describe('LandingView Component (Guest Visitors)', () => {
  afterEach(() => {
    cleanup()
  })
  it('renders hero title, value proposition, and primary CTAs', () => {
    render(<LandingView />)

    // Headline & Subtitle
    expect(screen.getByText(/Maximize Every Rupee Spent Across/i)).toBeDefined()
    expect(screen.getByText(/All Your Credit Cards/i)).toBeDefined()
    expect(screen.getByText(/Next-Gen Credit Card Intelligence/i)).toBeDefined()

    // CTAs
    expect(screen.getByText('Get Started Free')).toBeDefined()
    expect(screen.getByText('Explore Max Pro')).toBeDefined()

    // Core Pillars
    expect(screen.getByText('Unified Card Wallet')).toBeDefined()
    expect(screen.getByText('Rewards Optimizer')).toBeDefined()
    expect(screen.getByText('Automated Statement Sync')).toBeDefined()
    expect(screen.getByText('Max Pro Intelligence')).toBeDefined()

    // Security Trust Bar
    expect(screen.getByText('256-Bit Bank-Grade Encryption')).toBeDefined()
    expect(screen.getByText('ISO/IEC 27001 Aligned')).toBeDefined()
    expect(screen.getByText('Zero Credential or CVV Storage')).toBeDefined()
  })
})

describe('DashboardView Component (Authenticated Users)', () => {
  afterEach(() => {
    cleanup()
  })

  const mockFreeUserData: DashboardData = {
    user: {
      name: 'Rohan Sharma',
      email: 'rohan@example.com',
      isPro: false,
    },
    metrics: {
      totalCards: 3,
      activeCardsCount: 3,
      totalCreditLimit: 450000,
      nextDue: {
        cardName: 'HDFC Regalia Gold',
        dueDateFormatted: '15 Sep',
        daysRemaining: 5,
        hasUpcomingDue: true,
      },
    },
    gmailConnected: true,
    recommendations: [
      {
        category: 'Dining & Delivery',
        icon: '🍽️',
        bestCard: 'HDFC Regalia Gold',
        multiplier: '10X Points / 10% Off',
        perkSummary: 'Best for dining out, Swiggy, Zomato, and restaurants.',
        isOwned: true,
      },
      {
        category: 'Travel & Flights',
        icon: '✈️',
        bestCard: 'Axis Atlas / SBI Elite',
        multiplier: '5X Miles + Lounge Access',
        perkSummary: 'Complimentary domestic and international airport lounges.',
        isOwned: false,
      },
      {
        category: 'Fuel Surcharge',
        icon: '⛽',
        bestCard: 'BPCL SBI Octane',
        multiplier: '1% Waiver + 7.25% Val',
        perkSummary: 'Zero fuel surcharge across all petrol pumps.',
        isOwned: false,
      },
      {
        category: 'Online Shopping',
        icon: '🛍️',
        bestCard: 'Amazon Pay ICICI',
        multiplier: '5% Unlimited Cashback',
        perkSummary: 'Direct monthly statement credit on Amazon & partner portals.',
        isOwned: true,
      },
    ],
    recentStatementsCount: 2,
  }

  it('renders greeting, 3-card wallet overview metrics, and quick actions for free user', () => {
    render(<DashboardView data={mockFreeUserData} />)

    // Greeting & Status
    expect(screen.getByText(/Welcome back, Rohan Sharma/i)).toBeDefined()
    expect(screen.getByText('Free Tier')).toBeDefined()

    // Metrics
    expect(screen.getByText('Active Cards')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('Total Credit Limit')).toBeDefined()
    expect(screen.getByText(/₹4,50,000/)).toBeDefined()
    expect(screen.getByText('Next Statement Due')).toBeDefined()
    expect(screen.getByText('5 days')).toBeDefined()
    expect(screen.getByText('15 Sep')).toBeDefined()
    expect(screen.getAllByText(/HDFC Regalia Gold/).length).toBeGreaterThanOrEqual(1)

    // Quick Actions
    expect(screen.getByText('Add New Card')).toBeDefined()
    expect(screen.getByText('Manage Wallet')).toBeDefined()
    expect(screen.getByText('Gmail Statements')).toBeDefined()
    expect(screen.getByText('Consent Settings')).toBeDefined()

    // Recommendations Widget
    expect(screen.getByText('Best Card to Use This Month')).toBeDefined()
    expect(screen.getByText('Dining & Delivery')).toBeDefined()
    expect(screen.getByText('10X Points / 10% Off')).toBeDefined()
    expect(screen.getAllByText('In Your Wallet').length).toBe(2)
    expect(screen.getAllByText('Recommended Pick').length).toBe(2)

    // Max Pro Upgrade Card
    expect(screen.getByText('Supercharge Your Wallet with Max Pro')).toBeDefined()
    expect(screen.getByText('Upgrade to Max Pro')).toBeDefined()
  })

  it('renders Max Pro VIP status and perks when user is a Pro subscriber', () => {
    const mockProUserData: DashboardData = {
      ...mockFreeUserData,
      user: {
        name: 'Priya Patel',
        email: 'priya@example.com',
        isPro: true,
      },
    }

    render(<DashboardView data={mockProUserData} />)

    // VIP Badge & Perks
    expect(screen.getByText('Max Pro Member')).toBeDefined()
    expect(screen.getByText('Max Pro Perks Unlocked')).toBeDefined()
    expect(screen.getByText('Manage Max Pro Plan')).toBeDefined()
    expect(screen.getByText('Automated Statement PDF Extraction')).toBeDefined()
  })

  it('renders clear status when there are no upcoming payment dues', () => {
    const noDuesData: DashboardData = {
      ...mockFreeUserData,
      metrics: {
        ...mockFreeUserData.metrics,
        nextDue: {
          hasUpcomingDue: false,
        },
      },
    }

    render(<DashboardView data={noDuesData} />)

    expect(screen.getByText('No Dues')).toBeDefined()
    expect(screen.getByText('All statement payments clear')).toBeDefined()
  })
})
