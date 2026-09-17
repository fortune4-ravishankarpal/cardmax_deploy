'use client'

/**
 * ShowMeTheMathsModal
 * An interactive drill-down modal that visualizes exactly why a card is
 * recommended and the annual value gap vs. a baseline card.
 *
 * Data source: GET /api/cards/best-by-category?category=<slug>
 * Falls back to cardRates.ts static data if API returns nothing.
 *
 * Trigger: Pass a `recommendation` object + `onClose` handler.
 * The component is fully self-contained and importable from any page.
 */

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { buildCalcBreakdown, CATEGORY_CARD_RATES, type CalcBreakdown } from '@/lib/cardRates'
import type { BestCardByCategoryItem } from '@/app/api/cards/best-by-category/route'
import styles from './ShowMeTheMathsModal.module.scss'

export interface RecommendationMathData {
  category: string
  icon: string
  bestCard: string
  multiplier: string
}

interface Props {
  recommendation: RecommendationMathData
  onClose: () => void
}

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (val: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)

/** Convert category display name to the slug the API accepts */
function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/** Build a CalcBreakdown from live API data */
function breakdownFromLive(live: BestCardByCategoryItem): CalcBreakdown {
  const monthlySpend = live.defaultMonthlySpend || 5000
  const annualSpend = monthlySpend * 12

  let grossAnnualValue: number
  let rewardRate: string
  let monthlyReward: number

  if (live.isCashback) {
    grossAnnualValue = (annualSpend * live.cashbackPercent) / 100
    rewardRate = `${live.cashbackPercent}% cashback`
  } else {
    const totalPoints = (live.rewardPointsPer100 / 100) * annualSpend
    grossAnnualValue = totalPoints * live.pointValueINR
    rewardRate = `${live.rewardPointsPer100}X pts @ ₹${live.pointValueINR}/pt`
  }
  monthlyReward = grossAnnualValue / 12

  // Baseline: same category from static table for comparison
  const staticEntry = CATEGORY_CARD_RATES[live.category]
  const baselineGross = staticEntry
    ? (() => {
        const b = staticEntry.baseline
        if (b.isCashback) return (annualSpend * b.cashbackPercent) / 100
        const pts = (b.rewardPointsPer100 / 100) * annualSpend
        return pts * b.pointValueINR
      })()
    : (annualSpend * 2) / 100 // 2% generic fallback

  const baselineNet = baselineGross

  const netAnnualValue = grossAnnualValue - live.annualFeeINR
  const annualValueGap = netAnnualValue - baselineNet

  return {
    monthlySpend,
    annualSpend,
    rewardRate,
    monthlyReward,
    grossAnnualValue,
    annualFee: live.annualFeeINR,
    netAnnualValue,
    baselineNetValue: baselineNet,
    annualValueGap,
    earningMechanism: live.earningMechanism || rewardRate,
    isCashback: live.isCashback,
    cashbackPercent: live.cashbackPercent,
    rewardPointsPer100: live.rewardPointsPer100,
    pointValueINR: live.pointValueINR,
  }
}

// ── Count-up animation hook ─────────────────────────────────────────────────

function useCountUp(target: number, duration = 900, delay = 0): number {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    let start: number | null = null
    let rafId: number
    const timeout = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts
        const elapsed = ts - start
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCurrent(Math.round(target * eased))
        if (progress < 1) rafId = requestAnimationFrame(step)
      }
      rafId = requestAnimationFrame(step)
    }, delay)
    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(rafId)
    }
  }, [target, duration, delay])

  return current
}

// ── Animated bar fill ───────────────────────────────────────────────────────

function AnimatedBar({ pct, variant }: { pct: number; variant: 'recommended' | 'baseline' }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 80)
    return () => clearTimeout(t)
  }, [pct])
  return (
    <div className={styles.gapBarTrack}>
      <div
        className={`${styles.gapBarFill} ${styles[`gapBarFill--${variant}`]}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

// ── Skeleton loader ─────────────────────────────────────────────────────────

function ModalSkeleton() {
  return (
    <div className={styles.body} style={{ gap: '1rem' }}>
      {[140, 180, 120].map((h, i) => (
        <div
          key={i}
          style={{
            height: h,
            borderRadius: 12,
            background: 'rgba(108,76,241,0.08)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function ShowMeTheMathsModal({ recommendation, onClose }: Props) {
  const { category, icon, bestCard } = recommendation
  const dialogRef = useRef<HTMLDivElement>(null)

  // API fetch state
  const [liveData, setLiveData] = useState<BestCardByCategoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataSource, setDataSource] = useState<'live' | 'static'>('static')

  useEffect(() => {
    const slug = categoryToSlug(category)
    fetch(`/api/cards/best-by-category?category=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((data: BestCardByCategoryItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setLiveData(data[0])
          setDataSource('live')
        }
      })
      .catch(() => {/* silent — will fall back to static */})
      .finally(() => setLoading(false))
  }, [category])

  // Focus trap + Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Resolve breakdown: live data → static fallback
  const staticEntry = CATEGORY_CARD_RATES[category]
  const breakdown: CalcBreakdown | null = liveData
    ? breakdownFromLive(liveData)
    : buildCalcBreakdown(category)

  // Names for the bar chart
  const recommendedName = liveData?.cardName ?? staticEntry?.recommended?.name ?? bestCard
  const baselineName = staticEntry?.baseline?.name ?? 'Standard Rewards Card'

  // Count-up targets (start animating only after data is resolved)
  const gapAbs = breakdown ? Math.abs(breakdown.annualValueGap) : 0
  const animGap = useCountUp(gapAbs, 1000, 200)
  const animNet = useCountUp(breakdown?.netAnnualValue ?? 0, 900, 300)
  const animBase = useCountUp(breakdown?.baselineNetValue ?? 0, 900, 500)

  const maxBar = breakdown ? Math.max(breakdown.netAnnualValue, breakdown.baselineNetValue, 1) : 1
  const recPct = breakdown ? Math.min((breakdown.netAnnualValue / maxBar) * 100, 100) : 0
  const basePct = breakdown ? Math.min((breakdown.baselineNetValue / maxBar) * 100, 100) : 0

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Show Me the Maths — ${category}`}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerMeta}>
              <span className={styles.headerLabel}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" />
                  <line x1="8" y1="6" x2="16" y2="6" />
                  <line x1="8" y1="10" x2="10" y2="10" />
                  <line x1="14" y1="10" x2="16" y2="10" />
                  <line x1="8" y1="14" x2="10" y2="14" />
                  <line x1="14" y1="14" x2="16" y2="14" />
                  <line x1="8" y1="18" x2="10" y2="18" />
                  <line x1="14" y1="18" x2="16" y2="18" />
                </svg>
                Show Me the Maths · {icon} {category}
                {/* Data source badge */}
                {!loading && (
                  <span style={{
                    fontSize: '0.62rem', fontWeight: 700,
                    padding: '0.1rem 0.4rem', borderRadius: 4,
                    background: dataSource === 'live' ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.2)',
                    color: dataSource === 'live' ? '#4ade80' : '#fbbf24',
                    marginLeft: 4,
                  }}>
                    {dataSource === 'live' ? '● Live' : '● Static'}
                  </span>
                )}
              </span>
              <h2 className={styles.headerTitle}>{recommendedName}</h2>
            </div>
            <button
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close modal"
              id="show-maths-close-btn"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Verdict badge */}
          {breakdown && (
            <div className={styles.verdictBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              You save{' '}
              <span className={styles.verdictAmount}>
                {breakdown.annualValueGap >= 0 ? `+${fmt(animGap)}` : fmt(-animGap)}
              </span>{' '}
              per year vs. baseline
            </div>
          )}
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        {loading ? (
          <ModalSkeleton />
        ) : !breakdown ? (
          <div className={styles.body}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              No calculation data available for this category yet. Ask your admin to fill in the card details.
            </p>
          </div>
        ) : (
          <div className={styles.body}>

            {/* Section 1: Spend Assumption */}
            <div>
              <p className={styles.sectionTitle}>Spend Assumption</p>
              <div className={styles.assumptionBox}>
                <div>
                  <div className={styles.assumptionLabel}>Monthly spend in {category}</div>
                  <div className={styles.assumptionNote}>
                    {dataSource === 'live'
                      ? 'Set by admin for this card\'s category'
                      : 'Based on average Indian household for this category'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={styles.assumptionValue}>{fmt(breakdown.monthlySpend)}/mo</div>
                  <div className={styles.assumptionNote}>{fmt(breakdown.annualSpend)}/yr</div>
                </div>
              </div>
            </div>

            {/* Section 2: Calculation Breakdown */}
            <div>
              <p className={styles.sectionTitle}>Step-by-Step Calculation</p>

              {breakdown.earningMechanism && (
                <div className={styles.mechanismPill} style={{ marginBottom: '0.75rem' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                  {breakdown.earningMechanism}
                </div>
              )}

              <div className={styles.calcSteps}>
                <div className={styles.calcRow}>
                  <span className={styles.rowLabel}>
                    <span className={styles.rowOperator}></span>
                    Monthly Spend
                  </span>
                  <span className={styles.rowValue}>{fmt(breakdown.monthlySpend)}</span>
                </div>

                <div className={`${styles.calcRow} ${styles['calcRow--operator']}`}>
                  <span className={styles.rowLabel}>
                    <span className={styles.rowOperator}>×</span>
                    Reward Rate
                  </span>
                  <span className={styles.rowValue}>{breakdown.rewardRate}</span>
                </div>

                <div className={`${styles.calcRow} ${styles['calcRow--result']}`}>
                  <span className={styles.rowLabel}>
                    <span className={styles.rowOperator}>=</span>
                    Monthly Reward
                  </span>
                  <span className={`${styles.rowValue} ${styles['rowValue--green']}`}>
                    {fmt(breakdown.monthlyReward)}
                  </span>
                </div>

                <div className={`${styles.calcRow} ${styles['calcRow--operator']}`}>
                  <span className={styles.rowLabel}>
                    <span className={styles.rowOperator}>×</span>
                    12 Months
                  </span>
                  <span className={styles.rowValue}>12</span>
                </div>

                <div className={`${styles.calcRow} ${styles['calcRow--result']}`}>
                  <span className={styles.rowLabel}>
                    <span className={styles.rowOperator}>=</span>
                    Gross Annual Value
                  </span>
                  <span className={`${styles.rowValue} ${styles['rowValue--green']}`}>
                    {fmt(breakdown.grossAnnualValue)}
                  </span>
                </div>

                <div className={`${styles.calcRow} ${styles['calcRow--fee']}`}>
                  <span className={styles.rowLabel}>
                    <span className={styles.rowOperator}>−</span>
                    Annual Fee
                  </span>
                  <span className={`${styles.rowValue} ${breakdown.annualFee > 0 ? styles['rowValue--red'] : ''}`}>
                    {breakdown.annualFee > 0 ? `−${fmt(breakdown.annualFee)}` : 'Free'}
                  </span>
                </div>

                <div className={`${styles.calcRow} ${styles['calcRow--net']}`}>
                  <span className={styles.rowLabel}>
                    <span className={styles.rowOperator}>=</span>
                    <strong>Net Annual Value</strong>
                  </span>
                  <span className={`${styles.rowValue} ${styles['rowValue--large']} ${styles['rowValue--gold']}`}>
                    {fmt(animNet)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Annual Value Gap Bar */}
            <div>
              <p className={styles.sectionTitle}>Annual Value Gap</p>
              <div className={styles.gapSection}>
                <div className={styles.gapBarsWrapper}>
                  <div className={styles.gapBarRow}>
                    <div className={styles.gapBarMeta}>
                      <span className={styles.gapBarLabel}>{recommendedName}</span>
                      <span className={styles.gapBarAmt}>{fmt(animNet)}/yr</span>
                    </div>
                    <AnimatedBar pct={recPct} variant="recommended" />
                  </div>

                  <div className={styles.gapBarRow}>
                    <div className={styles.gapBarMeta}>
                      <span className={styles.gapBarLabel}>{baselineName}</span>
                      <span className={styles.gapBarAmt}>{fmt(animBase)}/yr</span>
                    </div>
                    <AnimatedBar pct={basePct} variant="baseline" />
                  </div>
                </div>

                <div className={styles.gapBadge}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  {breakdown.annualValueGap >= 0
                    ? `You earn ${fmt(Math.abs(animGap))} more per year with ${recommendedName}`
                    : `${recommendedName} earns ${fmt(Math.abs(animGap))} less — consider the fees`}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── CTA Footer ─────────────────────────────────────────────── */}
        <div className={styles.ctaFooter}>
          <div className={styles.divider} />
          <Link
            href="/wallet"
            className={styles.ctaBtn}
            id={`show-maths-cta-${category.replace(/\s+/g, '-').replace(/&/g, 'and').toLowerCase()}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="3" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            Apply / Add to My Wallet
          </Link>
          <p className={styles.ctaNote}>
            {dataSource === 'live'
              ? 'Calculations use data from our card database. Actual rewards may vary based on your spending pattern and card T&Cs.'
              : 'Calculations use illustrative average spend figures. Actual rewards may vary based on your spending pattern and card T&Cs.'}
          </p>
        </div>
      </div>
    </div>
  )
}
