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

  // Fetch all active credit cards from DB to populate recommendations dynamically
  const liveCardsRes = await payload.find({
    collection: 'CreditCard',
    where: { state: { equals: 'active' } },
    depth: 2,
    limit: 100,
    overrideAccess: true,
  })

  const CATEGORY_META: Record<string, { icon: string; label: string }> = {
    'dining-and-delivery': { icon: '🍽️', label: 'Dining & Delivery' },
    'dining':              { icon: '🍽️', label: 'Dining & Delivery' },
    'dinning':             { icon: '🍽️', label: 'Dining & Delivery' },
    'travel':              { icon: '✈️', label: 'Travel & Flights' },
    'travel-and-flights':  { icon: '✈️', label: 'Travel & Flights' },
    'fuel':                { icon: '⛽', label: 'Fuel Surcharge' },
    'fuel-surcharge':      { icon: '⛽', label: 'Fuel Surcharge' },
    'shopping':            { icon: '🛍️', label: 'Online Shopping' },
    'online-shopping':     { icon: '🛍️', label: 'Online Shopping' },
    'grocery':             { icon: '🥦', label: 'Grocery & Spends' },
    'groceries':           { icon: '🥦', label: 'Grocery & Spends' },
    'utilities':           { icon: '⚡', label: 'Utilities & Bills' },
    'utility-bills':       { icon: '⚡', label: 'Utilities & Bills' },
    'entertainment':       { icon: '🍿', label: 'Movies & Events' },
  }

  let recommendations: any[] = []

  if (liveCardsRes.docs && liveCardsRes.docs.length > 0) {
    const categoryMap = new Map<string, { catDoc: any; cards: any[] }>()

    for (const card of liveCardsRes.docs) {
      const cat = typeof card.category === 'object' && card.category ? card.category : null
      const catKey = cat?.slug || 'general'

      if (!categoryMap.has(catKey)) {
        categoryMap.set(catKey, { catDoc: cat, cards: [] })
      }
      categoryMap.get(catKey)!.cards.push(card)
    }

    recommendations = Array.from(categoryMap.entries()).map(([slug, { catDoc, cards }]) => {
      const best = cards[0]
      const meta = CATEGORY_META[slug] || (catDoc?.name ? CATEGORY_META[catDoc.name.toLowerCase()] : null)
      const isCashback = best.baseReward?.type === 'cashback'
      const multiplier = isCashback && best.baseReward?.cashbackPercentage
        ? `${best.baseReward.cashbackPercentage}% Cashback`
        : best.baseReward?.pointsPerBlock
          ? `${best.baseReward.pointsPerBlock}X Points`
          : 'Top Rewards'

      const isOwned = userCardNames.some((n: string) =>
        (best.name && n.includes(best.name.toLowerCase())) ||
        (best.slug && n.includes(best.slug.toLowerCase()))
      )

      return {
        category: meta?.label || catDoc?.name || 'Category Recommendation',
        categorySlug: slug,
        cardName: best.name,
        icon: meta?.icon || '💳',
        bestCard: best.name,
        multiplier,
        perkSummary: best.earningMechanism || best.description || 'Top tier rewards and benefits in this category.',
        isOwned,
      }
    })
  }

  // Fallback if no cards in DB
  if (recommendations.length === 0) {
    recommendations = [
      {
        category: 'Dining & Delivery',
        categorySlug: 'dinning',
        icon: '🍽️',
        bestCard: 'HDFC Swiggy / Diners Club',
        multiplier: '10X Points / 10% Off',
        perkSummary: 'Best for dining out, Swiggy, Zomato, and premium weekend restaurants.',
        isOwned: false,
      },
      {
        category: 'Travel & Flights',
        categorySlug: 'travel',
        icon: '✈️',
        bestCard: 'Axis Atlas / SBI Elite',
        multiplier: '5X Miles + Lounge Access',
        perkSummary: 'Complimentary domestic and international airport lounges with tier bonuses.',
        isOwned: false,
      },
      {
        category: 'Fuel Surcharge',
        categorySlug: 'fuel',
        icon: '⛽',
        bestCard: 'BPCL SBI Octane / IndianOil',
        multiplier: '1% Waiver + 7.25% Val',
        perkSummary: 'Zero fuel surcharge across all petrol pumps plus accelerated reward points.',
        isOwned: false,
      },
      {
        category: 'Online Shopping',
        categorySlug: 'online-shopping',
        icon: '🛍️',
        bestCard: 'SBI Cashback / Amazon Pay',
        multiplier: '5% Unlimited Cashback',
        perkSummary: 'Direct monthly statement credit on Amazon, Flipkart, Myntra, and online portals.',
        isOwned: false,
      },
    ]
  }

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
