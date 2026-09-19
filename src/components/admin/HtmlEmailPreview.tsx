'use client'

import React, { useState, useMemo } from 'react'
import { useField } from '@payloadcms/ui'
import styles from './HtmlEmailPreview.module.scss'

const SAMPLE_VARIABLES: Record<string, string> = {
  userName: 'Pratik',
  cardName: 'HDFC Infinia Metal',
  milestoneName: 'Quarterly ₹3 Lakh Spend',
  bonusPoints: '10,000',
  spendAmount: '₹3,00,000',
  totalSpend: '₹45,200',
  potentialSavings: '₹2,500',
  analysisDate: '19 Sep 2026',
  cardCount: '3',
  amount: '₹2,999',
  planName: 'CardMax Pro Annual',
  paymentId: 'pay_K923xLa892',
  nextBillingDate: '19 Sep 2027',
  month: 'August 2026',
  totalPointsEarned: '14,200',
  topCard: 'HDFC Infinia',
  daysRemaining: '25',
  amountRemaining: '₹80,000',
  currentSpend: '₹9,20,000',
  targetSpend: '₹10,00,000',
  annualFee: '₹10,000',
  year: '2026',
  devaluationDetails: 'Lounge access now requires ₹50k monthly spend',
  effectiveDate: '1 November 2026',
  trialDays: '14',
  expiryDate: '3 Oct 2026',
  status: 'Approved',
  applicationId: 'APP-9821',
  bankName: 'HDFC Bank',
  daysSinceApplied: '7',
  daysLeft: '3',
  renewalUrl: 'https://cardmax.app/billing',
  appUrl: 'https://cardmax.app/dashboard',
  actionUrl: 'https://cardmax.app/billing',
}

function interpolate(text: string = '', data: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? `{{${key}}}`)
}

export const HtmlEmailPreview: React.FC = () => {
  const { value: htmlVal } = useField<string>({ path: 'html' })
  const { value: bodyVal } = useField<string>({ path: 'body' })
  const { value: subjectVal } = useField<string>({ path: 'subject' })

  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile' | 'full'>('desktop')

  const interpolatedSubject = useMemo(() => {
    return interpolate(subjectVal || 'No Subject Defined', SAMPLE_VARIABLES)
  }, [subjectVal])

  const renderedContent = useMemo(() => {
    if (htmlVal && htmlVal.trim().length > 0) {
      return interpolate(htmlVal, SAMPLE_VARIABLES)
    }

    if (bodyVal && bodyVal.trim().length > 0) {
      const formattedBody = interpolate(bodyVal, SAMPLE_VARIABLES).replace(/\n/g, '<br/>')
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; padding: 32px 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">CardMax Notification</span>
            </div>
            <div style="font-size: 15px; line-height: 1.7; color: #334155;">
              ${formattedBody}
            </div>
            <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
              <em>(Previewing formatted Body text because HTML field is empty)</em>
            </div>
          </div>
        </body>
        </html>
      `
    }

    return `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 300px; color: #94a3b8; text-align: center;">
        <div>
          <p style="font-size: 16px; margin: 0 0 6px 0; font-weight: 600;">No Content to Preview</p>
          <p style="font-size: 13px; margin: 0;">Type in the Body or HTML field above to see your live preview.</p>
        </div>
      </body>
      </html>
    `
  }, [htmlVal, bodyVal])

  const containerWidth = useMemo(() => {
    switch (deviceView) {
      case 'mobile':
        return '375px'
      case 'desktop':
        return '600px'
      case 'full':
      default:
        return '100%'
    }
  }, [deviceView])

  return (
    <div className={styles.previewWrapper}>
      {/* Top Toolbar */}
      <div className={styles.previewToolbar}>
        <div className={styles.toolbarLeft}>
          <div className={styles.liveIndicator}>
            <span className={styles.dot} />
            <span>Live Email Preview</span>
          </div>
          <span className={styles.previewTitle}>
            {htmlVal?.trim() ? 'Rendering Custom HTML' : 'Rendering Formatted Body'}
          </span>
        </div>

        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={`${styles.deviceBtn} ${deviceView === 'desktop' ? styles.active : ''}`}
            onClick={() => setDeviceView('desktop')}
            title="Desktop Newsletter View (600px)"
          >
            💻 Desktop (600px)
          </button>
          <button
            type="button"
            className={`${styles.deviceBtn} ${deviceView === 'mobile' ? styles.active : ''}`}
            onClick={() => setDeviceView('mobile')}
            title="Mobile Smartphone View (375px)"
          >
            📱 Mobile (375px)
          </button>
          <button
            type="button"
            className={`${styles.deviceBtn} ${deviceView === 'full' ? styles.active : ''}`}
            onClick={() => setDeviceView('full')}
            title="Full Width View"
          >
            🖥️ Full
          </button>
        </div>
      </div>

      {/* Simulated Email Client Header */}
      <div className={styles.metaBar}>
        <div className={styles.metaItem}>
          <strong>Subject:</strong>
          <span>{interpolatedSubject}</span>
        </div>
        <div className={styles.metaItem}>
          <strong>From:</strong>
          <span>CardMax &lt;noreply@cardmax.com&gt;</span>
        </div>
      </div>

      {/* Sandboxed Live Canvas */}
      <div className={styles.previewCanvas}>
        <div
          className={styles.frameContainer}
          style={{ width: containerWidth, maxWidth: '100%' }}
        >
          <iframe
            title="HTML Email Preview"
            srcDoc={renderedContent}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}

export default HtmlEmailPreview
