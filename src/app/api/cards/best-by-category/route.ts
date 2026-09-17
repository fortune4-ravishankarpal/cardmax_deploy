import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * GET /api/cards/best-by-category
 *
 * Returns the best credit card for each spending category, sourced live
 * from the Payload CreditCard collection. Used by the "Show Me the Maths" modal.
 *
 * Optional query param:
 *   ?category=dining-and-delivery  → returns only that category's card
 *
 * Cards are matched in two ways:
 *  1. Primary:  card has a `category` relationship whose slug matches the query
 *  2. Fallback: if no category-matched cards exist, returns ALL active cards
 *     with `defaultMonthlySpend` or `earningMechanism` filled in (so admin can
 *     populate a card's data and see it in the modal even without a category assigned).
 */

export interface BestCardByCategoryItem {
  category: string
  categorySlug: string
  cardName: string
  bankName: string
  annualFeeINR: number
  isCashback: boolean
  cashbackPercent: number
  rewardPointsPer100: number
  pointValueINR: number
  defaultMonthlySpend: number
  earningMechanism: string
}

function computeNetAnnualValue(card: any, monthlySpend: number): number {
  const annualSpend = monthlySpend * 12
  const reward = card.baseReward
  if (!reward) return 0

  if (reward.type === 'cashback') {
    const gross = (annualSpend * (reward.cashbackPercentage ?? 0)) / 100
    return gross - (card.fees?.annualFee ?? 0)
  }

  const blockSize = reward.blockSize ?? 100
  const pointsPerBlock = reward.pointsPerBlock ?? 0
  const pointValue = card.pointValuation?.realisticValue ?? 0.25
  const totalPoints = (annualSpend / blockSize) * pointsPerBlock
  const gross = totalPoints * pointValue
  return gross - (card.fees?.annualFee ?? 0)
}

function buildItem(
  doc: any,
  categoryName: string,
  categorySlug: string,
): BestCardByCategoryItem {
  const reward = doc.baseReward ?? {}
  const isCashback = reward.type === 'cashback'
  const blockSize = reward.blockSize ?? 100
  const pointsPerBlock = reward.pointsPerBlock ?? 0
  const rewardPointsPer100 = blockSize > 0 ? (pointsPerBlock / blockSize) * 100 : 0

  const bankName =
    (typeof doc.bank === 'object' && doc.bank?.name) ||
    (typeof doc.bank === 'string' && doc.bank) ||
    'Unknown Bank'

  return {
    category: categoryName,
    categorySlug,
    cardName: doc.name ?? 'Unknown Card',
    bankName,
    annualFeeINR: doc.fees?.annualFee ?? 0,
    isCashback,
    cashbackPercent: reward.cashbackPercentage ?? 0,
    rewardPointsPer100,
    pointValueINR: doc.pointValuation?.realisticValue ?? 0.25,
    defaultMonthlySpend: doc.defaultMonthlySpend ?? 5000,
    earningMechanism: doc.earningMechanism ?? '',
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const filterCategory = searchParams.get('category') // optional slug filter

    const payload = await getPayload({ config: await config })

    // Fetch all published, active credit cards with their category populated
    const result = await payload.find({
      collection: 'CreditCard',
      where: { state: { equals: 'active' } },
      depth: 2,
      limit: 200,
      overrideAccess: true,
    })

    const cards = result.docs

    // ── Strategy 1: group by category relationship ──────────────────────────
    const categoryMap = new Map<string, { name: string; slug: string; cards: any[] }>()

    for (const card of cards) {
      const catDoc = typeof card.category === 'object' && card.category
      if (!catDoc) continue

      const catSlug: string = catDoc.slug ?? ''
      const catName: string = catDoc.name ?? ''
      if (!catSlug) continue

      if (filterCategory && catSlug !== filterCategory) continue

      if (!categoryMap.has(catSlug)) {
        categoryMap.set(catSlug, { name: catName, slug: catSlug, cards: [] })
      }
      categoryMap.get(catSlug)!.cards.push(card)
    }

    const bestCards: BestCardByCategoryItem[] = []

    for (const [, group] of categoryMap) {
      const defaultSpend = group.cards[0]?.defaultMonthlySpend ?? 5000
      const sorted = [...group.cards].sort(
        (a, b) => computeNetAnnualValue(b, defaultSpend) - computeNetAnnualValue(a, defaultSpend),
      )
      const best = sorted[0]
      if (best) bestCards.push(buildItem(best, group.name, group.slug))
    }

    // ── Strategy 2: Fallback — cards with no category but with reward data ──
    // If no category-grouped results were found (e.g. admin hasn't assigned
    // categories yet), return all active cards that have at least one of
    // defaultMonthlySpend or earningMechanism filled in.
    // The modal will use the card data directly (no category grouping).
    if (bestCards.length === 0) {
      const uncategorised = cards.filter(
        (c) =>
          (!c.category || (typeof c.category === 'object' && !c.category?.slug)) &&
          (c.defaultMonthlySpend || c.earningMechanism),
      )

      // If a specific category filter was given but no match was found,
      // also return fully uncategorised cards sorted by value so the modal
      // still has something to show.
      const cardsToReturn = uncategorised.length > 0 ? uncategorised : cards

      // Use the filter slug as the synthetic category slug
      const syntheticSlug = filterCategory ?? 'general'
      const syntheticLabel = filterCategory
        ? filterCategory.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        : 'General'

      const sorted = [...cardsToReturn].sort(
        (a, b) =>
          computeNetAnnualValue(b, b.defaultMonthlySpend ?? 5000) -
          computeNetAnnualValue(a, a.defaultMonthlySpend ?? 5000),
      )

      if (sorted[0]) {
        bestCards.push(buildItem(sorted[0], syntheticLabel, syntheticSlug))
      }
    }

    return NextResponse.json(bestCards, {
      status: 200,
      headers: {
        // Cache for 2 minutes — short enough that admin edits reflect quickly
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=30',
      },
    })
  } catch (err) {
    console.error('[best-by-category] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch card recommendations' },
      { status: 500 },
    )
  }
}
