import React from 'react'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { EntitlementsService } from '@/subscriptions/entitlements'
import {
  DashboardView,
  LandingView,
  type DashboardData,
} from './components/Dashboard'
import './home.scss'

export const metadata = {
  title: 'Dashboard — CardMax',
  description: 'Consolidated credit card wallet, reward optimization, and statement intelligence.',
}

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // 1. If visitor is a guest, render the landing page hero
  if (!user || user.collection !== 'users') {
    return <LandingView />
  }

  // 2. Authenticated user: Fetch live financial & wallet data
  const userId = String(user.id)

  // Fetch all user cards with populated master card relationships
  const userCardsRes = await payload.find({
    collection: 'user-cards',
    where: {
      user: { equals: userId },
    },
    depth: 2,
    limit: 100,
    overrideAccess: true,
  })

  // Fetch recent statements
  const statementsRes = await payload.find({
    collection: 'statements',
    where: {
      user: { equals: userId },
    },
    sort: '-paymentDueDate',
    limit: 5,
    overrideAccess: true,
  })

  // Check Gmail statement sync connection
  const gmailRes = await payload.find({
    collection: 'gmail-connections',
    where: {
      user: { equals: userId },
    },
    limit: 1,
    overrideAccess: true,
  })

  // Check Max Pro subscription entitlement
  const isPro = await EntitlementsService.hasMaxPro(userId)

  // Compute metrics
  const allCards = userCardsRes.docs
  const activeCards = allCards.filter((c: any) => c.status === 'active')
  const totalCreditLimit = activeCards.reduce((acc: number, c: any) => {
    return acc + (typeof c.creditLimit === 'number' ? c.creditLimit : 0)
  }, 0)

  // Determine nearest upcoming payment due date
  const now = new Date()
  let nearestDueDate: Date | null = null
  let nearestCardName: string = ''

  // A. Check explicit statements first
  for (const st of statementsRes.docs) {
    if (st.paymentDueDate) {
      const d = new Date(st.paymentDueDate)
      if (d >= now) {
        if (!nearestDueDate || d < nearestDueDate) {
          nearestDueDate = d
          nearestCardName = st.issuer || 'Credit Card'
        }
      }
    }
  }

  // B. Check recurring card due days if no upcoming statement
  if (!nearestDueDate) {
    for (const c of activeCards) {
      const dueDay = (c as any).paymentDueDay
      if (typeof dueDay === 'number' && dueDay >= 1 && dueDay <= 31) {
        let d = new Date(now.getFullYear(), now.getMonth(), dueDay)
        if (d < now) {
          d = new Date(now.getFullYear(), now.getMonth() + 1, dueDay)
        }
        if (!nearestDueDate || d < nearestDueDate) {
          nearestDueDate = d
          const cardObj = (c as any).card
          nearestCardName =
            (c as any).displayName ||
            (cardObj && typeof cardObj === 'object' ? cardObj.name : null) ||
            'Credit Card'
        }
      }
    }
  }

  let nextDueInfo = {
    cardName: nearestCardName,
    dueDateFormatted: '',
    daysRemaining: 0,
    hasUpcomingDue: false,
  }

  if (nearestDueDate) {
    const diffMs = nearestDueDate.getTime() - now.getTime()
    const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    nextDueInfo = {
      cardName: nearestCardName,
      dueDateFormatted: nearestDueDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      }),
      daysRemaining: days,
      hasUpcomingDue: true,
    }
  }

  // Compute category recommendations matching user's cards
  const userCardNames = activeCards.map((c: any) => {
    const cardObj = c.card
    return (
      (c.displayName || '') +
      ' ' +
      (cardObj && typeof cardObj === 'object' ? cardObj.name || '' : '')
    ).toLowerCase()
  })

  const hasDiningMatch = userCardNames.some((n) =>
    ['dining', 'regalia', 'diners', 'swiggy', 'zomato', 'hsbc'].some((k) =>
      n.includes(k)
    )
  )

  const hasTravelMatch = userCardNames.some((n) =>
    ['travel', 'atlas', 'vistara', 'miles', 'prime', 'platinum'].some((k) =>
      n.includes(k)
    )
  )

  const hasFuelMatch = userCardNames.some((n) =>
    ['fuel', 'bpcl', 'indianoil', 'hpcl', 'octane'].some((k) => n.includes(k))
  )

  const hasShoppingMatch = userCardNames.some((n) =>
    ['cashback', 'amazon', 'flipkart', 'millennia', 'ace'].some((k) =>
      n.includes(k)
    )
  )

  const recommendations = [
    {
      category: 'Dining & Delivery',
      icon: '🍽️',
      bestCard: hasDiningMatch
        ? activeCards[0]?.displayName || 'Your Primary Card'
        : 'HDFC Swiggy / Diners Club',
      multiplier: '10X Points / 10% Off',
      perkSummary:
        'Best for dining out, Swiggy, Zomato, and premium weekend restaurants.',
      isOwned: hasDiningMatch,
    },
    {
      category: 'Travel & Flights',
      icon: '✈️',
      bestCard: hasTravelMatch
        ? activeCards[0]?.displayName || 'Your Travel Card'
        : 'Axis Atlas / SBI Elite',
      multiplier: '5X Miles + Lounge Access',
      perkSummary:
        'Complimentary domestic and international airport lounges with tier bonuses.',
      isOwned: hasTravelMatch,
    },
    {
      category: 'Fuel Surcharge',
      icon: '⛽',
      bestCard: hasFuelMatch
        ? activeCards[0]?.displayName || 'Your Fuel Card'
        : 'BPCL SBI Octane / IndianOil',
      multiplier: '1% Waiver + 7.25% Val',
      perkSummary:
        'Zero fuel surcharge across all petrol pumps plus accelerated reward points.',
      isOwned: hasFuelMatch,
    },
    {
      category: 'Online Shopping',
      icon: '🛍️',
      bestCard: hasShoppingMatch
        ? activeCards[0]?.displayName || 'Your Cashback Card'
        : 'SBI Cashback / Amazon Pay',
      multiplier: '5% Unlimited Cashback',
      perkSummary:
        'Direct monthly statement credit on Amazon, Flipkart, Myntra, and online portals.',
      isOwned: hasShoppingMatch,
    },
  ]

  const dashboardData: DashboardData = {
    user: {
      name:
        (user as any).name ||
        (user as any).firstName ||
        user.email.split('@')[0] ||
        'Member',
      email: user.email,
      isPro,
    },
    metrics: {
      totalCards: allCards.length,
      activeCardsCount: activeCards.length,
      totalCreditLimit,
      nextDue: nextDueInfo,
    },
    gmailConnected: gmailRes.docs.length > 0,
    recommendations,
    recentStatementsCount: statementsRes.docs.length,
  }

  return <DashboardView data={dashboardData} />
}
