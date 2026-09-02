import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { env } from '../../../../lib/env'

export async function POST(req: NextRequest) {
  try {
    // Basic auth for cron jobs
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })
    const { searchParams } = new URL(req.url)
    const jobType = searchParams.get('type')

    if (jobType === 'expire_subscriptions') {
      await payload.jobs.queue({
          task: 'expireSubscriptions',
          input: {}
      })
      return NextResponse.json({ queued: true, task: 'expireSubscriptions' })
    }

    if (jobType === 'reconcile_subscriptions') {
      await payload.jobs.queue({
          task: 'reconcileSubscriptions',
          input: {}
      })
      return NextResponse.json({ queued: true, task: 'reconcileSubscriptions' })
    }

    return NextResponse.json({ error: 'Unknown job type' }, { status: 400 })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
