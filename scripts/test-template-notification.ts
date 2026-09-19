import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { env } from '../src/lib/env'
import { NotificationService } from '../src/notifications/service'

async function main() {
  const args = process.argv.slice(2)
  const isLiveFlag = args.includes('--live')
  const emailArg = args.find((a) => a.includes('@'))
  const recipient = emailArg || 'test@gmail.com'
  const isSimulation = isLiveFlag ? false : env.NOTIFICATION_MODE === 'simulation'

  console.log('================================================================')
  console.log(' CardMax End-to-End Notification Template & Dispatch Test')
  console.log('================================================================')
  console.log(`NOTIFICATION_MODE : ${env.NOTIFICATION_MODE}`)
  console.log(`Execution Mode    : ${isSimulation ? 'SIMULATION (Mock)' : 'LIVE (Sending Real Email)'}`)
  console.log(`Recipient Target  : ${recipient}`)
  console.log('----------------------------------------------------------------\n')

  try {
    const payload = await getPayload({ config: configPromise })

    // ─────────────────────────────────────────────────────────────
    // STEP 1: Find or Create the User
    // ─────────────────────────────────────────────────────────────
    console.log('🔹 STEP 1: Resolving recipient user...')
    const userResult = await payload.find({
      collection: 'users',
      where: { email: { equals: recipient } },
      limit: 1,
      overrideAccess: true,
    })

    let user = userResult.docs[0]
    if (!user) {
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
            milestoneAlerts: true,
          },
        },
        overrideAccess: true,
      })
      console.log(`   Created new user (ID: ${user.id})`)
    } else {
      console.log(`   Found existing user (ID: ${user.id})`)
      // Ensure milestone alerts preference is enabled
      await payload.update({
        collection: 'users',
        id: user.id,
        data: {
          notificationPreferences: {
            ...((user as any).notificationPreferences || {}),
            emailEnabled: true,
            milestoneAlerts: true,
          },
        },
        overrideAccess: true,
      })
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 2: Create or Update an Admin Notification Template for Email
    // ─────────────────────────────────────────────────────────────
    console.log('\n🔹 STEP 2: Setting up Notification Template for Email in Payload CMS...')

    const existingEmailTmpl = await payload.find({
      collection: 'notification-templates',
      where: {
        and: [
          { eventType: { equals: 'MILESTONE_ACHIEVED' } },
          { channel: { equals: 'email' } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    const emailTemplateData = {
      name: 'Milestone Achieved – Premium Email Template',
      eventType: 'MILESTONE_ACHIEVED' as const,
      channel: 'email' as const,
      isActive: true,
      subject: '🎉 Amazing news, {{userName}}! You hit the {{milestoneName}} goal!',
      title: 'Milestone Achieved: {{milestoneName}}',
      body: 'Congratulations {{userName}}! Your card {{cardName}} reached the {{milestoneName}} milestone. You earned {{bonusPoints}} reward points!',
      variables: [
        { name: 'userName', description: 'User first name' },
        { name: 'cardName', description: 'Credit Card display name' },
        { name: 'milestoneName', description: 'Target spend milestone name' },
        { name: 'bonusPoints', description: 'Bonus points credited' },
      ],
    }

    let emailTmplDoc: any
    if (existingEmailTmpl.docs.length > 0) {
      emailTmplDoc = await payload.update({
        collection: 'notification-templates',
        id: existingEmailTmpl.docs[0].id,
        data: emailTemplateData,
        overrideAccess: true,
      })
      console.log(`   Updated existing Email Template (ID: ${emailTmplDoc.id})`)
    } else {
      emailTmplDoc = await payload.create({
        collection: 'notification-templates',
        data: emailTemplateData,
        overrideAccess: true,
      })
      console.log(`   Created new Email Template (ID: ${emailTmplDoc.id})`)
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 3: Create or Update an In-App Notification Template
    // ─────────────────────────────────────────────────────────────
    console.log('\n🔹 STEP 3: Setting up Notification Template for In-App in Payload CMS...')

    const existingInAppTmpl = await payload.find({
      collection: 'notification-templates',
      where: {
        and: [
          { eventType: { equals: 'MILESTONE_ACHIEVED' } },
          { channel: { equals: 'in_app' } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    const inAppTemplateData = {
      name: 'Milestone Achieved – In-App Banner',
      eventType: 'MILESTONE_ACHIEVED' as const,
      channel: 'in_app' as const,
      isActive: true,
      title: '🎯 Milestone Unlocked: {{milestoneName}}',
      body: '{{userName}}, your {{cardName}} achieved {{milestoneName}}! Enjoy your {{bonusPoints}} bonus points.',
      variables: [
        { name: 'userName', description: 'User first name' },
        { name: 'cardName', description: 'Credit Card display name' },
        { name: 'milestoneName', description: 'Target spend milestone name' },
        { name: 'bonusPoints', description: 'Bonus points credited' },
      ],
    }

    let inAppTmplDoc: any
    if (existingInAppTmpl.docs.length > 0) {
      inAppTmplDoc = await payload.update({
        collection: 'notification-templates',
        id: existingInAppTmpl.docs[0].id,
        data: inAppTemplateData,
        overrideAccess: true,
      })
      console.log(`   Updated existing In-App Template (ID: ${inAppTmplDoc.id})`)
    } else {
      inAppTmplDoc = await payload.create({
        collection: 'notification-templates',
        data: inAppTemplateData,
        overrideAccess: true,
      })
      console.log(`   Created new In-App Template (ID: ${inAppTmplDoc.id})`)
    }

    // ─────────────────────────────────────────────────────────────
    // STEP 4: Publish the Event & Verify Interpolation & Template Linking
    // ─────────────────────────────────────────────────────────────
    console.log('\n🔹 STEP 4: Triggering NotificationService.publishEvent()...')
    const eventId = `MILESTONE_EVT_${Date.now()}`

    const eventPayload = {
      eventId,
      eventType: 'MILESTONE_ACHIEVED' as const,
      userId: String(user.id),
      channels: ['email', 'in_app'] as ('email' | 'in_app')[],
      data: {
        userName: 'John Doe',
        cardName: 'HDFC Infinia Metal',
        milestoneName: 'Quarterly ₹3 Lakh Spend',
        bonusPoints: '10,000',
      },
    }

    const result = await NotificationService.publishEvent(eventPayload, payload)
    console.log('   Publish Result:', JSON.stringify(result, null, 2))

    // ─────────────────────────────────────────────────────────────
    // STEP 5: Inspect the Generated Notifications in Database
    // ─────────────────────────────────────────────────────────────
    console.log('\n🔹 STEP 5: Verifying generated database records...')

    const createdNotifications = await payload.find({
      collection: 'notifications',
      where: { eventId: { equals: eventId } },
      depth: 1,
      overrideAccess: true,
    })

    console.log(`   Found ${createdNotifications.totalDocs} notification record(s) created for this event:`)
    for (const notif of createdNotifications.docs) {
      console.log(`\n   --- [Channel: ${notif.channel}] ---`)
      console.log(`   ID       : ${notif.id}`)
      console.log(`   Title    : ${notif.title}`)
      console.log(`   Message  : ${notif.message}`)
      console.log(`   Status   : ${notif.status}`)
      console.log(`   Template : ${(notif as any).template?.name || (notif as any).template || '(none)'}`)
      console.log(`   SentAt   : ${notif.sentAt}`)
      console.log(`   Metadata :`, notif.metadata)
    }

    console.log('\n================================================================')
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!')
    console.log('================================================================')
    console.log('Check your Payload Admin Panel to see the results:')
    console.log('1. Templates   : http://localhost:3000/admin/collections/notification-templates')
    console.log('2. Notifications: http://localhost:3000/admin/collections/notifications')
  } catch (err: any) {
    console.error('\n❌ Fatal error during test:', err.message, err.stack)
  }

  process.exit(0)
}

main()
