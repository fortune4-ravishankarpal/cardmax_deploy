import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { env } from '../src/lib/env'
import { NotificationService } from '../src/notifications/service'

async function main() {
  const args = process.argv.slice(2)
  const isLiveFlag = args.includes('--live')
  const emailArg = args.find((a) => a.includes('@'))
  const recipient = emailArg || env.FROM_EMAIL || 'test@cardmax.local'
  const isSimulation = isLiveFlag ? false : env.NOTIFICATION_MODE === 'simulation'

  console.log('==================================================')
  console.log(' CardMax Notification & Email Test')
  console.log('==================================================')
  console.log(`NOTIFICATION_MODE : ${env.NOTIFICATION_MODE}`)
  console.log(`Execution Mode    : ${isSimulation ? 'SIMULATION (Mock)' : 'LIVE (Actual dispatch)'}`)
  console.log(`EMAIL_PROVIDER    : ${env.EMAIL_PROVIDER}`)
  console.log(`Recipient Target  : ${recipient}`)
  console.log('--------------------------------------------------')

  try {
    const payload = await getPayload({ config: configPromise })

    // 1. Find or create a user in Payload
    let userResult = await payload.find({
      collection: 'users',
      where: { email: { equals: recipient } },
      limit: 1,
      overrideAccess: true,
    })

    let user = userResult.docs[0]

    if (!user) {
      console.log(`User ${recipient} not found in database. Creating test user...`)
      user = await (payload.create as any)({
        collection: 'users',
        data: {
          email: recipient,
          password: 'TestPassword123!',
          acceptedTermsAndConditions: true,
          acceptedPrivacyPolicy: true,
          notificationPreferences: {
            pushEnabled: true,
            emailEnabled: true,
            analysisResults: true,
          },
        },
        overrideAccess: true,
      })
      console.log(`Created user ID: ${user.id}`)
    } else {
      console.log(`Found existing user ID: ${user.id}`)
    }

    // 2. Publish full notification event (writes to Payload 'notifications' collection)
    const eventId = `TEST_ANALYSIS_${Date.now()}`
    console.log(`Publishing NotificationEvent: ${eventId}...`)

    const publishResult = await NotificationService.publishEvent(
      {
        eventId,
        eventType: 'ANALYSIS_COMPLETED',
        userId: String(user.id),
        channels: ['in_app', 'email'],
        data: {
          userName: (user as any).name || recipient.split('@')[0],
          analysisDate: new Date().toLocaleDateString(),
        },
      },
      payload,
    )

    console.log('\nPublish Result:', JSON.stringify(publishResult, null, 2))
    console.log('\n✅ Successfully created notification records in Payload!')
    console.log('👉 Refresh your Payload Admin: http://localhost:3000/admin/collections/notifications')
  } catch (err: any) {
    console.error('\n❌ Fatal error during test:', err.message, err.stack)
  }

  process.exit(0)
}

main()
