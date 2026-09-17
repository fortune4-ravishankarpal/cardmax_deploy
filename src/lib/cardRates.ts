/**
 * cardRates.ts
 * Curated reward-rate lookup table for top Indian credit cards.
 * Used by the "Show Me the Maths" modal to power static calculation breakdowns.
 *
 * Phase 2: Migrate these values into Payload `cards` collection fields.
 */

export interface CardRate {
  /** Display name of the card */
  name: string
  /** Bank short name */
  bank: string
  /** Reward points earned per ₹100 spent in the relevant category */
  rewardPointsPer100: number
  /** Monetary value of 1 reward point in ₹ */
  pointValueINR: number
  /** Effective cashback % if it's a cashback card (0 if points-based) */
  cashbackPercent: number
  /** Annual fee in ₹ (0 if lifetime free or first-year waived) */
  annualFeeINR: number
  /** Short description of the primary earning mechanism */
  earningMechanism: string
  /** Whether this is a cashback card (true) or points card (false) */
  isCashback: boolean
}

/** Top-rated cards per spend category. Keys match `recommendation.category`. */
export const CATEGORY_CARD_RATES: Record<
  string,
  { recommended: CardRate; baseline: CardRate; defaultMonthlySpend: number }
> = {
  'Dining & Delivery': {
    defaultMonthlySpend: 5000,
    recommended: {
      name: 'HDFC Swiggy Credit Card',
      bank: 'HDFC',
      rewardPointsPer100: 0,
      cashbackPercent: 10,
      pointValueINR: 0,
      annualFeeINR: 500,
      earningMechanism: '10% cashback on Swiggy, Zomato & dining',
      isCashback: true,
    },
    baseline: {
      name: 'Standard Rewards Card',
      bank: 'Generic',
      rewardPointsPer100: 2,
      cashbackPercent: 0,
      pointValueINR: 0.25,
      annualFeeINR: 0,
      earningMechanism: '2X reward points on all spends',
      isCashback: false,
    },
  },
  'Travel & Flights': {
    defaultMonthlySpend: 8000,
    recommended: {
      name: 'Axis Atlas Credit Card',
      bank: 'Axis',
      rewardPointsPer100: 5,
      cashbackPercent: 0,
      pointValueINR: 1.0,
      annualFeeINR: 5000,
      earningMechanism: '5 EDGE Miles per ₹100 (worth ₹1 each in air miles)',
      isCashback: false,
    },
    baseline: {
      name: 'Standard Rewards Card',
      bank: 'Generic',
      rewardPointsPer100: 2,
      cashbackPercent: 0,
      pointValueINR: 0.25,
      annualFeeINR: 0,
      earningMechanism: '2X reward points on all spends',
      isCashback: false,
    },
  },
  'Fuel Surcharge': {
    defaultMonthlySpend: 4000,
    recommended: {
      name: 'BPCL SBI Octane Credit Card',
      bank: 'SBI',
      rewardPointsPer100: 25,
      cashbackPercent: 0,
      pointValueINR: 0.25,
      annualFeeINR: 1499,
      earningMechanism: '25X reward points at BPCL fuel stations (1% surcharge waiver)',
      isCashback: false,
    },
    baseline: {
      name: 'Standard Rewards Card',
      bank: 'Generic',
      rewardPointsPer100: 2,
      cashbackPercent: 0,
      pointValueINR: 0.25,
      annualFeeINR: 0,
      earningMechanism: '2X reward points on all spends',
      isCashback: false,
    },
  },
  'Online Shopping': {
    defaultMonthlySpend: 6000,
    recommended: {
      name: 'SBI Cashback Credit Card',
      bank: 'SBI',
      rewardPointsPer100: 0,
      cashbackPercent: 5,
      pointValueINR: 0,
      annualFeeINR: 999,
      earningMechanism: '5% unlimited cashback on all online transactions',
      isCashback: true,
    },
    baseline: {
      name: 'Standard Rewards Card',
      bank: 'Generic',
      rewardPointsPer100: 2,
      cashbackPercent: 0,
      pointValueINR: 0.25,
      annualFeeINR: 0,
      earningMechanism: '2X reward points on all spends',
      isCashback: false,
    },
  },
}

/**
 * Computes gross annual value (in ₹) for a card + monthly spend amount.
 * Handles both cashback and points-based cards.
 */
export function computeAnnualValue(card: CardRate, monthlySpend: number): number {
  const annualSpend = monthlySpend * 12

  if (card.isCashback) {
    return (annualSpend * card.cashbackPercent) / 100
  }

  // Points-based: points earned per ₹100 × (annual spend / 100) × point value
  const totalPoints = (card.rewardPointsPer100 / 100) * annualSpend
  return totalPoints * card.pointValueINR
}

/**
 * Returns the full calculation breakdown for the modal.
 */
export interface CalcBreakdown {
  monthlySpend: number
  annualSpend: number
  rewardRate: string
  monthlyReward: number
  grossAnnualValue: number
  annualFee: number
  netAnnualValue: number
  baselineNetValue: number
  annualValueGap: number
  earningMechanism: string
  isCashback: boolean
  cashbackPercent: number
  rewardPointsPer100: number
  pointValueINR: number
}

export function buildCalcBreakdown(
  category: string,
): CalcBreakdown | null {
  const entry = CATEGORY_CARD_RATES[category]
  if (!entry) return null

  const { recommended, baseline, defaultMonthlySpend } = entry
  const monthlySpend = defaultMonthlySpend

  const grossAnnualRec = computeAnnualValue(recommended, monthlySpend)
  const netAnnualRec = grossAnnualRec - recommended.annualFeeINR
  const grossAnnualBase = computeAnnualValue(baseline, monthlySpend)
  const netAnnualBase = grossAnnualBase - baseline.annualFeeINR
  const gap = netAnnualRec - netAnnualBase

  const monthlyReward = grossAnnualRec / 12

  const rewardRate = recommended.isCashback
    ? `${recommended.cashbackPercent}% cashback`
    : `${recommended.rewardPointsPer100}X points @ ₹${recommended.pointValueINR}/pt`

  return {
    monthlySpend,
    annualSpend: monthlySpend * 12,
    rewardRate,
    monthlyReward,
    grossAnnualValue: grossAnnualRec,
    annualFee: recommended.annualFeeINR,
    netAnnualValue: netAnnualRec,
    baselineNetValue: netAnnualBase,
    annualValueGap: gap,
    earningMechanism: recommended.earningMechanism,
    isCashback: recommended.isCashback,
    cashbackPercent: recommended.cashbackPercent,
    rewardPointsPer100: recommended.rewardPointsPer100,
    pointValueINR: recommended.pointValueINR,
  }
}
