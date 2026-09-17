import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

/**
 * GET /api/cards/best-by-category
 *
 * Returns the best credit card for each spending category, sourced live
 * from the Payload CreditCard collection. Used by the "Show Me the Maths" modal.
 *
 * Query params:
 *   ?category=<slug>  → filters by category (supports aliases/synonyms like fuel/fuel-surcharge)
 *   ?card=<name>      → filters by card name
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

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  fuel: ['fuel', 'fuel-surcharge', 'surcharge', 'petrol', 'diesel', 'gas', 'bpcl', 'indianoil', 'hpcl'],
  travel: ['travel', 'travel-and-flights', 'flights', 'flight', 'airline', 'hotel', 'hotels', 'atlas', 'miles'],
  dining: ['dining', 'dinning', 'dining-and-delivery', 'food', 'delivery', 'restaurant', 'restaurants', 'swiggy', 'zomato'],
  shopping: ['shopping', 'online-shopping', 'ecommerce', 'retail', 'marketplace', 'amazon', 'flipkart'],
}

function matchCategory(dbCatSlug: string, dbCatName: string, queryCat: string): boolean {
  const cleanDbSlug = (dbCatSlug || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const cleanDbName = (dbCatName || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const cleanQuery = (queryCat || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  if (!cleanQuery) return true
  if (cleanDbSlug === cleanQuery || cleanDbName === cleanQuery) return true
  if (cleanDbSlug.length > 2 && cleanQuery.includes(cleanDbSlug)) return true
  if (cleanQuery.length > 2 && cleanDbSlug.includes(cleanQuery)) return true
  if (cleanDbName.length > 2 && cleanQuery.includes(cleanDbName)) return true
  if (cleanQuery.length > 2 && cleanDbName.includes(cleanQuery)) return true

  for (const list of Object.values(CATEGORY_SYNONYMS)) {
    const queryInGroup = list.some((term) => {
      const clean = term.replace(/[^a-z0-9]/g, '')
      return cleanQuery.includes(clean) || clean.includes(cleanQuery)
    })
    const dbInGroup = list.some((term) => {
      const clean = term.replace(/[^a-z0-9]/g, '')
      return cleanDbSlug.includes(clean) || cleanDbName.includes(clean)
    })
    if (queryInGroup && dbInGroup) return true
  }

  return false
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
    const filterCategory = searchParams.get('category')
    const filterCard = searchParams.get('card') || searchParams.get('cardName')

    const payload = await getPayload({ config: await config })

    // Fetch all published, active credit cards with their relations populated
    const result = await payload.find({
      collection: 'CreditCard',
      where: { state: { equals: 'active' } },
      depth: 2,
      limit: 200,
      overrideAccess: true,
    })

    let cards = result.docs

    // Optional card name filter
    if (filterCard) {
      const cleanName = filterCard.toLowerCase().trim()
      cards = cards.filter((c) => (c.name || '').toLowerCase().includes(cleanName))
    }

    // ── Strategy 1: group by category relationship ──────────────────────────
    const categoryMap = new Map<string, { name: string; slug: string; cards: any[] }>()

    for (const card of cards) {
      const catDoc = typeof card.category === 'object' && card.category
      if (!catDoc) continue

      const catSlug: string = catDoc.slug ?? ''
      const catName: string = catDoc.name ?? ''
      if (!catSlug) continue

      // Check category match if filterCategory is supplied
      if (filterCategory && !matchCategory(catSlug, catName, filterCategory)) {
        continue
      }

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

    // ── Strategy 2: If NO category filter was provided, but no cards had categories,
    // fallback to returning active cards with custom reward data.
    // NOTE: If a category filter WAS requested and nothing matched, return [] rather than
    // disguising an unrelated card!
    if (!filterCategory && bestCards.length === 0) {
      const uncategorised = cards.filter(
        (c) =>
          (!c.category || (typeof c.category === 'object' && !c.category?.slug)) &&
          (c.defaultMonthlySpend || c.earningMechanism),
      )

      const cardsToReturn = uncategorised.length > 0 ? uncategorised : cards
      for (const card of cardsToReturn) {
        bestCards.push(buildItem(card, 'General', 'general'))
      }
    }

    return NextResponse.json(bestCards, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
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
