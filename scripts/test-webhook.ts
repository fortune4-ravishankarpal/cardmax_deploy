import crypto from 'crypto'
import { env } from '../src/lib/env'

async function run() {
  const secret = env.RAZORPAY_WEBHOOK_SECRET
  const subId = process.argv[2] || 'sub_TYLPL1PofzFwGc'
  const payId = `pay_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const eventId = `evt_${Date.now()}`

  const payload = JSON.stringify({
    entity: 'event',
    account_id: 'acc_test',
    event: 'subscription.charged',
    contains: ['subscription', 'payment'],
    payload: {
      subscription: {
        entity: {
          id: subId,
          plan_id: 'plan_TYGgEmWUo40HVU',
          status: 'active',
          current_start: Math.floor(Date.now() / 1000),
          current_end: Math.floor((Date.now() + 30 * 86400 * 1000) / 1000),
        },
      },
      payment: {
        entity: {
          id: payId,
          subscription_id: subId,
          amount: 29900,
          currency: 'INR',
          status: 'captured',
          method: 'card',
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  })

  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')

  console.log(`Sending test webhook for Subscription: ${subId}, Payment: ${payId}`)
  console.log(`Using RAZORPAY_WEBHOOK_SECRET: ${secret.slice(0, 4)}...`)

  try {
    const res = await fetch('http://localhost:3000/api/payments/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature,
        'x-razorpay-event-id': eventId,
      },
      body: payload,
    })

    const data = await res.json()
    console.log(`HTTP Status: ${res.status}`)
    console.log('Response:', data)
  } catch (err: any) {
    console.error('Failed to send webhook:', err.message)
  }
}

run()
