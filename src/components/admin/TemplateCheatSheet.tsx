'use client'

import React, { useState } from 'react'
import { toast } from '@payloadcms/ui'
import styles from './TemplateCheatSheet.module.scss'

interface VariableDef {
  name: string
  desc: string
  example: string
}

interface EventCheatSheet {
  title: string
  scenario: string
  variables: VariableDef[]
  example: {
    subject?: string
    title: string
    body: string
  }
}

export const EVENT_DETAILS: Record<string, EventCheatSheet> = {
  ANALYSIS_COMPLETED: {
    title: 'Statement Analysis Ready',
    scenario: 'Triggered when CardMax finishes scanning and parsing a user’s monthly credit card PDF statement.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'cardName', desc: 'Credit card name', example: 'HDFC Infinia' },
      { name: 'analysisDate', desc: 'Date statement was processed', example: '19 Sep 2026' },
      { name: 'totalSpend', desc: 'Total spend in the statement period', example: '₹45,200' },
      { name: 'potentialSavings', desc: 'Estimated reward savings identified', example: '₹2,500' },
      { name: 'cardCount', desc: 'Number of active cards analyzed', example: '3' },
    ],
    example: {
      subject: '📊 Your {{cardName}} statement analysis is ready, {{userName}}!',
      title: 'Statement Analysis Ready',
      body: 'Hello {{userName}}, we analyzed your {{cardName}} statement. You spent {{totalSpend}} and could save {{potentialSavings}} by optimizing rewards!',
    },
  },
  MILESTONE_ACHIEVED: {
    title: 'Spend Milestone Reached',
    scenario: 'Triggered when a user’s card transactions reach a reward milestone or bonus points threshold.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'cardName', desc: 'Credit card name', example: 'HDFC Infinia Metal' },
      { name: 'milestoneName', desc: 'Name of the milestone reached', example: 'Quarterly ₹3 Lakh Spend' },
      { name: 'bonusPoints', desc: 'Bonus reward points or cashback credited', example: '10,000' },
      { name: 'spendAmount', desc: 'Total spend reached', example: '₹3,00,000' },
    ],
    example: {
      subject: '🎉 Amazing news, {{userName}}! You hit the {{milestoneName}} goal!',
      title: '🎯 Milestone Unlocked: {{milestoneName}}',
      body: 'Congratulations {{userName}}! Your card {{cardName}} reached {{milestoneName}}. You earned {{bonusPoints}} reward points!',
    },
  },
  FEE_WAIVER_APPROACHING: {
    title: 'Fee Waiver Approaching',
    scenario: 'Triggered when a user is within 15–30% of the spend threshold to waive their annual credit card fee.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'cardName', desc: 'Credit card name', example: 'Axis Magnus' },
      { name: 'currentSpend', desc: 'Amount spent so far this year', example: '₹9,20,000' },
      { name: 'targetSpend', desc: 'Spend required to waive annual fee', example: '₹10,00,000' },
      { name: 'amountRemaining', desc: 'Remaining spend needed', example: '₹80,000' },
      { name: 'daysRemaining', desc: 'Days remaining before card anniversary', example: '25' },
    ],
    example: {
      subject: '⚠️ {{userName}}, you are close to waiving your {{cardName}} annual fee!',
      title: 'Fee Waiver Approaching',
      body: '{{userName}}, spend just {{amountRemaining}} more on your {{cardName}} in the next {{daysRemaining}} days to waive your upcoming annual fee!',
    },
  },
  FEE_WAIVER_ACHIEVED: {
    title: 'Fee Waiver Achieved',
    scenario: 'Triggered when a user hits the required annual spend so their upcoming annual credit card fee is waived.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'cardName', desc: 'Credit card name', example: 'SBI Aurum' },
      { name: 'annualFee', desc: 'Annual fee amount waived', example: '₹10,000' },
      { name: 'spendAmount', desc: 'Total eligible spend completed', example: '₹10,05,000' },
      { name: 'year', desc: 'Membership year', example: '2026' },
    ],
    example: {
      subject: '🚀 Annual Fee Waived on your {{cardName}}!',
      title: 'Annual Fee Waived! 🎉',
      body: 'Congratulations {{userName}}! You hit the spend goal on your {{cardName}}. Your {{annualFee}} annual fee is 100% waived for {{year}}.',
    },
  },
  DEVALUATION_DETECTED: {
    title: 'Card Devaluation Detected',
    scenario: 'Triggered when an issuer bank announces changes to reward rates, lounge access limits, or fee structures.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'cardName', desc: 'Affected credit card name', example: 'ICICI Emeralde' },
      { name: 'devaluationDetails', desc: 'Short summary of the changes', example: 'Lounge access now requires ₹50k monthly spend' },
      { name: 'effectiveDate', desc: 'When the change goes live', example: '1 November 2026' },
    ],
    example: {
      subject: '⚠️ Important Alert: Terms changing for {{cardName}}',
      title: 'Card Devaluation Alert',
      body: 'Hello {{userName}}, {{cardName}} is updating its terms on {{effectiveDate}}: {{devaluationDetails}}. Tap to review impact.',
    },
  },
  ELIGIBILITY_GRANTED: {
    title: 'Trial / Eligibility Granted',
    scenario: 'Triggered when a customer unlocks a free trial or eligibility for CardMax Pro membership.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'trialDays', desc: 'Number of free trial days', example: '14' },
      { name: 'expiryDate', desc: 'Date when the trial ends', example: '3 Oct 2026' },
    ],
    example: {
      subject: '🌟 Welcome to CardMax Pro — Your {{trialDays}}-Day Trial is Live!',
      title: 'CardMax Pro Trial Activated',
      body: 'Enjoy full access to advanced reward optimization and devaluation alerts until {{expiryDate}}.',
    },
  },
  APPLICATION_STATUS_CHANGED: {
    title: 'Card Application Updated',
    scenario: 'Triggered when the status of an external credit card application changes (e.g. Approved, In Review, Rejected).',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'cardName', desc: 'Credit card applied for', example: 'Tata Neu Infinity' },
      { name: 'status', desc: 'New status', example: 'Approved' },
      { name: 'applicationId', desc: 'Internal or bank application reference', example: 'APP-9821' },
      { name: 'bankName', desc: 'Issuing bank name', example: 'HDFC Bank' },
    ],
    example: {
      subject: 'Status Update: Your {{cardName}} application is {{status}}',
      title: 'Application Update: {{status}}',
      body: 'Hello {{userName}}, {{bankName}} has updated your application for {{cardName}} to: {{status}}.',
    },
  },
  APPLICATION_FOLLOWUP: {
    title: 'Application Follow-Up',
    scenario: 'Triggered 7 days after applying if a card application is still pending with the bank.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'cardName', desc: 'Credit card applied for', example: 'Amex Platinum Travel' },
      { name: 'daysSinceApplied', desc: 'Number of days elapsed', example: '7' },
      { name: 'bankName', desc: 'Issuing bank', example: 'American Express' },
    ],
    example: {
      subject: 'Follow-up Reminder: {{cardName}} Application',
      title: 'Follow-Up on Your Card Application',
      body: 'It has been {{daysSinceApplied}} days since your application for {{cardName}}. Tap to check status or call {{bankName}} support.',
    },
  },
  ONBOARDING_COMPLETED: {
    title: 'Welcome / Onboarding Complete',
    scenario: 'Triggered immediately after a new user completes their initial profile and preferences.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'appUrl', desc: 'Link to dashboard', example: 'https://cardmax.app/dashboard' },
    ],
    example: {
      subject: 'Welcome to CardMax, {{userName}}! 🚀',
      title: 'Welcome to CardMax!',
      body: 'Your profile is ready {{userName}}! Connect your statement or add your cards to maximize every rupee you spend.',
    },
  },
  MONTHLY_SUMMARY: {
    title: 'Monthly Rewards Summary',
    scenario: 'Triggered on the 1st of each month to summarize the user’s total spend and points earned across all cards.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'month', desc: 'Name of the month', example: 'August 2026' },
      { name: 'totalSpend', desc: 'Total spend across cards', example: '₹84,300' },
      { name: 'totalPointsEarned', desc: 'Total reward points gained', example: '14,200' },
      { name: 'topCard', desc: 'Highest rewarding card of the month', example: 'HDFC Infinia' },
    ],
    example: {
      subject: '📈 Your {{month}} CardMax Rewards Digest is Here!',
      title: 'Your {{month}} Rewards Summary',
      body: 'In {{month}}, you spent {{totalSpend}} and unlocked {{totalPointsEarned}} points. Your star card was {{topCard}}!',
    },
  },
  PAYMENT_SUCCESS: {
    title: 'Payment Confirmed',
    scenario: 'Triggered when Razorpay/Stripe charges a user for CardMax Pro successfully.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'amount', desc: 'Amount charged', example: '₹2,999' },
      { name: 'planName', desc: 'Plan name', example: 'CardMax Pro Annual' },
      { name: 'paymentId', desc: 'Razorpay payment transaction ID', example: 'pay_K923xLa' },
      { name: 'nextBillingDate', desc: 'Next billing renewal date', example: '19 Sep 2027' },
    ],
    example: {
      subject: 'Receipt: Payment of {{amount}} for {{planName}} confirmed',
      title: 'Payment Confirmed',
      body: 'Thank you {{userName}}! We received your payment of {{amount}} for {{planName}}. Your next billing date is {{nextBillingDate}}.',
    },
  },
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    scenario: 'Triggered when an automatic subscription renewal charge fails due to insufficient funds or expired card.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'amount', desc: 'Amount attempted', example: '₹2,999' },
      { name: 'planName', desc: 'Plan name', example: 'CardMax Pro Annual' },
      { name: 'retryDate', desc: 'Date of next automatic retry', example: '22 Sep 2026' },
      { name: 'actionUrl', desc: 'Link to update payment method', example: 'https://cardmax.app/billing' },
    ],
    example: {
      subject: 'Action Required: Payment for {{planName}} could not be processed',
      title: 'Payment Failed — Action Required',
      body: 'Your renewal of {{amount}} for {{planName}} failed. Please update your payment method to avoid losing Pro benefits.',
    },
  },
  SUBSCRIPTION_STARTED: {
    title: 'Subscription Started',
    scenario: 'Triggered when a new user signs up for CardMax Pro for the first time.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'planName', desc: 'Plan name', example: 'CardMax Pro Annual' },
      { name: 'expiryDate', desc: 'End date of current term', example: '19 Sep 2027' },
    ],
    example: {
      subject: 'Welcome to {{planName}}, {{userName}}! 🎉',
      title: 'Welcome to CardMax Pro!',
      body: 'Your {{planName}} is now active until {{expiryDate}}. Enjoy unlimited statement analyses and devaluation alerts.',
    },
  },
  SUBSCRIPTION_RENEWED: {
    title: 'Subscription Renewed',
    scenario: 'Triggered on successful automatic subscription renewal.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'planName', desc: 'Plan name', example: 'CardMax Pro Monthly' },
      { name: 'amount', desc: 'Renewal amount', example: '₹299' },
      { name: 'nextRenewalDate', desc: 'Next renewal date', example: '19 Oct 2026' },
    ],
    example: {
      subject: 'Your {{planName}} has been renewed',
      title: 'Subscription Renewed',
      body: 'Your {{planName}} renewed successfully for {{amount}}. Next renewal date: {{nextRenewalDate}}.',
    },
  },
  SUBSCRIPTION_EXPIRING: {
    title: 'Subscription Expiring Soon',
    scenario: 'Triggered 3 days before a subscription expires or during a payment grace period.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'planName', desc: 'Plan name', example: 'CardMax Pro' },
      { name: 'daysLeft', desc: 'Days left until expiration', example: '3' },
      { name: 'renewalUrl', desc: 'Direct link to renew', example: 'https://cardmax.app/billing' },
    ],
    example: {
      subject: 'CardMax Pro: Only {{daysLeft}} days remaining',
      title: 'Subscription Expiring Soon',
      body: '{{userName}}, your {{planName}} subscription ends in {{daysLeft}} days. Renew today to keep your reward insights active!',
    },
  },
  SUBSCRIPTION_CANCELLED: {
    title: 'Subscription Cancelled',
    scenario: 'Triggered when a user cancels auto-renewal.',
    variables: [
      { name: 'userName', desc: 'Customer’s first name', example: 'John Doe' },
      { name: 'planName', desc: 'Plan name', example: 'CardMax Pro' },
      { name: 'endDate', desc: 'Date when access will expire', example: '19 Oct 2026' },
    ],
    example: {
      subject: 'Confirmation: {{planName}} cancelled',
      title: 'Subscription Cancelled',
      body: 'Your {{planName}} cancellation is confirmed. You will continue to have access to Pro features until {{endDate}}.',
    },
  },
}

export const TemplateCheatSheet: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<string>('ANALYSIS_COMPLETED')
  const eventData = EVENT_DETAILS[selectedEvent] || EVENT_DETAILS.ANALYSIS_COMPLETED

  const handleCopy = (varName: string) => {
    const textToCopy = `{{${varName}}}`
    navigator.clipboard.writeText(textToCopy)
    toast.success(`Copied ${textToCopy} to clipboard!`)
  }

  const handleCopyExample = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied example copy to clipboard!')
  }

  return (
    <div className={styles.cheatSheetContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h4>💡 Variables & Trigger Guide</h4>
          <span className={styles.badge}>Live Helper</span>
        </div>
        <div className={styles.selector}>
          <label htmlFor="event-select">Viewing Event:</label>
          <select
            id="event-select"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            {Object.keys(EVENT_DETAILS).map((key) => (
              <option key={key} value={key}>
                {key} ({EVENT_DETAILS[key].title})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Real-life Trigger Scenario */}
      <div className={styles.scenarioBox}>
        <strong>When does this send? </strong>
        {eventData.scenario}
      </div>

      {/* Variables Section */}
      <div className={styles.variablesSection}>
        <div className={styles.sectionTitle}>
          Available Variables (Click any variable to copy it into your template):
        </div>
        <div className={styles.variableGrid}>
          {eventData.variables.map((v) => (
            <div
              key={v.name}
              className={styles.variableCard}
              onClick={() => handleCopy(v.name)}
              title="Click to copy to clipboard"
            >
              <div className={styles.cardHeader}>
                <code>{`{{${v.name}}}`}</code>
                <span className={styles.copyHint}>📋 Click to copy</span>
              </div>
              <div className={styles.description}>
                {v.desc} <em>(e.g. &ldquo;{v.example}&rdquo;)</em>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blueprint / Example Copy */}
      <div className={styles.exampleBox}>
        <div className={styles.exampleHeader}>
          <span>Example Template Copy for {eventData.title}</span>
          <button
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#60a5fa',
              cursor: 'pointer',
              fontSize: '11px',
              textDecoration: 'underline',
            }}
            onClick={() => handleCopyExample(eventData.example.body)}
          >
            Copy Example Body
          </button>
        </div>
        <div className={styles.exampleContent}>
          {eventData.example.subject && (
            <div>
              <strong>Subject: </strong>
              {eventData.example.subject}
            </div>
          )}
          <div>
            <strong>Title: </strong>
            {eventData.example.title}
          </div>
          <div>
            <strong>Body: </strong>
            {eventData.example.body}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateCheatSheet
