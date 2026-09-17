'use client'

/**
 * ShowMeTheMathsModal
 * An interactive drill-down modal that visualizes exactly why a card is
 * recommended and the annual value gap vs. a baseline card.
 *
 * Trigger: Pass a `recommendation` object + `onClose` handler.
 * The component is fully self-contained and importable from any page.
 */

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { buildCalcBreakdown, type CalcBreakdown } from '@/lib/cardRates'
import { CATEGORY_CARD_RATES } from '@/lib/cardRates'
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

const fmt = (val: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val)

// Count-up animation hook — animates a number from 0 → target over duration ms
function useCountUp(target: number, duration = 900, delay = 0): number {
  const [current, setCurrent] = React.useState(0)

  useEffect(() => {
    let start: number | null = null
    let rafId: number

    const timeout = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!start) start = timestamp
        const elapsed = timestamp - start
        const progress = Math.min(elapsed / duration, 1)
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3)
        setCurrent(Math.round(target * eased))
        if (progress < 1) {
          rafId = requestAnimationFrame(step)
        }
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

// BarFill with CSS-driven width transition triggered after mount
function AnimatedBar({
  pct,
  variant,
}: {
  pct: number
  variant: 'recommended' | 'baseline'
}) {
  const [width, setWidth] = React.useState(0)

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

export default function ShowMeTheMathsModal({ recommendation, onClose }: Props) {
  const { category, icon, bestCard } = recommendation
  const dialogRef = useRef<HTMLDivElement>(null)

  // Build breakdown from the curated rate table
  const breakdown: CalcBreakdown | null = buildCalcBreakdown(category)
  const entry = CATEGORY_CARD_RATES[category]

  // Focus trap + Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    // Prevent body scroll while modal is open
    document.body.style.overflow = 'hidden'

    // Move focus into modal
    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // If no rate data available, show a graceful fallback
  if (!breakdown || !entry) {
    return (
      <div
        className={styles.backdrop}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Show Me the Maths"
      >
        <div
          className={styles.modal}
          onClick={(e) => e.stopPropagation()}
          ref={dialogRef}
          tabIndex={-1}
        >
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.headerMeta}>
                <span className={styles.headerLabel}>{icon} {category}</span>
                <h2 className={styles.headerTitle}>No rate data available</h2>
              </div>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className={styles.body}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Rate data for this category is not yet available. Check back soon!
            </p>
          </div>
        </div>
      </div>
    )
  }

  const {
    monthlySpend,
    annualSpend,
    rewardRate,
    monthlyReward,
    grossAnnualValue,
    annualFee,
    netAnnualValue,
    baselineNetValue,
    annualValueGap,
    earningMechanism,
  } = breakdown

  const maxBar = Math.max(netAnnualValue, baselineNetValue, 1)
  const recPct = Math.min((netAnnualValue / maxBar) * 100, 100)
  const basePct = Math.min((baselineNetValue / maxBar) * 100, 100)

  // Count-up targets with staggered delays
  const animGap = useCountUp(Math.abs(annualValueGap), 1000, 200)
  const animNet = useCountUp(netAnnualValue, 900, 300)
  const animBase = useCountUp(baselineNetValue, 900, 500)

  const baselineName = entry.baseline.name
  const recommendedName = entry.recommended.name

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
                {/* Calculator icon */}
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
              </span>
              <h2 className={styles.headerTitle}>{bestCard}</h2>
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
          <div className={styles.verdictBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            You save{' '}
            <span className={styles.verdictAmount}>
              {annualValueGap >= 0 ? `+${fmt(animGap)}` : `${fmt(-animGap)}`}
            </span>{' '}
            per year vs. baseline
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className={styles.body}>

          {/* Section 1: Spend Assumption */}
          <div>
            <p className={styles.sectionTitle}>Spend Assumption</p>
            <div className={styles.assumptionBox}>
              <div>
                <div className={styles.assumptionLabel}>Monthly spend in {category}</div>
                <div className={styles.assumptionNote}>Based on average Indian household for this category</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={styles.assumptionValue}>{fmt(monthlySpend)}/mo</div>
                <div className={styles.assumptionNote}>{fmt(annualSpend)}/yr</div>
              </div>
            </div>
          </div>

          {/* Section 2: Calculation Breakdown */}
          <div>
            <p className={styles.sectionTitle}>Step-by-Step Calculation</p>

            {/* Earning mechanism pill */}
            <div className={styles.mechanismPill} style={{ marginBottom: '0.75rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              {earningMechanism}
            </div>

            <div className={styles.calcSteps}>
              {/* Row 1: Monthly Spend */}
              <div className={styles.calcRow}>
                <span className={styles.rowLabel}>
                  <span className={styles.rowOperator}></span>
                  Monthly Spend
                </span>
                <span className={styles.rowValue}>{fmt(monthlySpend)}</span>
              </div>

              {/* Row 2: Reward Rate */}
              <div className={`${styles.calcRow} ${styles['calcRow--operator']}`}>
                <span className={styles.rowLabel}>
                  <span className={styles.rowOperator}>×</span>
                  Reward Rate
                </span>
                <span className={styles.rowValue}>{rewardRate}</span>
              </div>

              {/* Row 3: Monthly Reward */}
              <div className={`${styles.calcRow} ${styles['calcRow--result']}`}>
                <span className={styles.rowLabel}>
                  <span className={styles.rowOperator}>=</span>
                  Monthly Reward
                </span>
                <span className={`${styles.rowValue} ${styles['rowValue--green']}`}>
                  {fmt(monthlyReward)}
                </span>
              </div>

              {/* Row 4: × 12 months */}
              <div className={`${styles.calcRow} ${styles['calcRow--operator']}`}>
                <span className={styles.rowLabel}>
                  <span className={styles.rowOperator}>×</span>
                  12 Months
                </span>
                <span className={styles.rowValue}>12</span>
              </div>

              {/* Row 5: Gross Annual Value */}
              <div className={`${styles.calcRow} ${styles['calcRow--result']}`}>
                <span className={styles.rowLabel}>
                  <span className={styles.rowOperator}>=</span>
                  Gross Annual Value
                </span>
                <span className={`${styles.rowValue} ${styles['rowValue--green']}`}>
                  {fmt(grossAnnualValue)}
                </span>
              </div>

              {/* Row 6: Annual Fee */}
              <div className={`${styles.calcRow} ${styles['calcRow--fee']}`}>
                <span className={styles.rowLabel}>
                  <span className={styles.rowOperator}>−</span>
                  Annual Fee
                </span>
                <span className={`${styles.rowValue} ${annualFee > 0 ? styles['rowValue--red'] : ''}`}>
                  {annualFee > 0 ? `−${fmt(annualFee)}` : 'Free'}
                </span>
              </div>

              {/* Row 7: Net Annual Value */}
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
                {/* Recommended Card bar */}
                <div className={styles.gapBarRow}>
                  <div className={styles.gapBarMeta}>
                    <span className={styles.gapBarLabel}>{recommendedName}</span>
                    <span className={styles.gapBarAmt}>{fmt(animNet)}/yr</span>
                  </div>
                  <AnimatedBar pct={recPct} variant="recommended" />
                </div>

                {/* Baseline bar */}
                <div className={styles.gapBarRow}>
                  <div className={styles.gapBarMeta}>
                    <span className={styles.gapBarLabel}>{baselineName}</span>
                    <span className={styles.gapBarAmt}>{fmt(animBase)}/yr</span>
                  </div>
                  <AnimatedBar pct={basePct} variant="baseline" />
                </div>
              </div>

              {/* Gap badge */}
              <div className={styles.gapBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                {annualValueGap >= 0
                  ? `You earn ${fmt(Math.abs(animGap))} more per year with ${recommendedName}`
                  : `${recommendedName} earns ${fmt(Math.abs(animGap))} less — consider fees`}
              </div>
            </div>
          </div>

        </div>{/* end body */}

        {/* ── CTA Footer ─────────────────────────────────────────────── */}
        <div className={styles.ctaFooter}>
          <div className={styles.divider} />
          <Link
            href="/wallet"
            className={styles.ctaBtn}
            id={`show-maths-cta-${category.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="3" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            Apply / Add to My Wallet
          </Link>
          <p className={styles.ctaNote}>
            Calculations use illustrative average spend figures. Actual rewards may vary based on your spending pattern and card T&amp;Cs.
          </p>
        </div>
      </div>
    </div>
  )
}
