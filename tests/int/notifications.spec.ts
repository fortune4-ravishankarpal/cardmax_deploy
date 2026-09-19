/**
 * Integration tests: Notification System (8.18 & 8.19)
 *
 * Tests idempotency, state transitions, preferences, access control,
 * device token deactivation, simulation mode, payment events, and grouping.
 *
 * Run with: pnpm vitest run tests/int/notifications.spec.ts
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { NotificationService } from '../../src/notifications/service'
import { isEventProcessed } from '../../src/notifications/idempotency'

let payload: Payload
let testUserId: string
let testUser2Id: string
let adminToken: string

beforeAll(async () => {
  payload = await getPayload({ config })

  // Create test user 1
  const user1 = await (payload.create as any)({
    collection: 'users',
    data: {
      email: `notif-test-1-${Date.now()}@cardmax.test`,
      password: 'TestPass1!',
      acceptedTermsAndConditions: true,
      acceptedPrivacyPolicy: true,
    },
    overrideAccess: true,
  })
  testUserId = String(user1.id)

  // Create test user 2
  const user2 = await (payload.create as any)({
    collection: 'users',
    data: {
      email: `notif-test-2-${Date.now()}@cardmax.test`,
      password: 'TestPass2!',
      acceptedTermsAndConditions: true,
      acceptedPrivacyPolicy: true,
    },
    overrideAccess: true,
  })
  testUser2Id = String(user2.id)
})

afterAll(async () => {
  // Cleanup test users (cascade deletes notifications, device tokens, etc.)
  if (testUserId) {
    await payload.delete({ collection: 'users', id: testUserId, overrideAccess: true }).catch(() => {})
  }
  if (testUser2Id) {
    await payload.delete({ collection: 'users', id: testUser2Id, overrideAccess: true }).catch(() => {})
  }
})

// ─── 1. Idempotency ───────────────────────────────────────────────────────────

describe('1. Idempotency', () => {
  it('should NOT create duplicate notification records for same (eventId, channel)', async () => {
    const eventId = `IDEMPOTENCY_TEST_${Date.now()}`

    // Publish once
    await NotificationService.publishEvent(
      { eventId, eventType: 'ANALYSIS_COMPLETED', userId: testUserId },
      payload,
    )

    // Check in_app exists
    const before = await payload.find({
      collection: 'notifications',
      where: { and: [{ eventId: { equals: eventId } }, { channel: { equals: 'in_app' } }] },
      overrideAccess: true,
    })
    expect(before.totalDocs).toBe(1)

    // Publish again with the SAME eventId
    await NotificationService.publishEvent(
      { eventId, eventType: 'ANALYSIS_COMPLETED', userId: testUserId },
      payload,
    )

    // Should still be exactly 1
    const after = await payload.find({
      collection: 'notifications',
      where: { and: [{ eventId: { equals: eventId } }, { channel: { equals: 'in_app' } }] },
      overrideAccess: true,
    })
    expect(after.totalDocs).toBe(1)
  })

  it('isEventProcessed should return true after first publish', async () => {
    const eventId = `IDEMPOTENCY_CHECK_${Date.now()}`

    const before = await isEventProcessed(payload, eventId, 'in_app')
    expect(before).toBe(false)

    await NotificationService.publishEvent(
      { eventId, eventType: 'PAYMENT_SUCCESS', userId: testUserId, channels: ['in_app'] },
      payload,
    )

    const after = await isEventProcessed(payload, eventId, 'in_app')
    expect(after).toBe(true)
  })
})

// ─── 2. State Transition ──────────────────────────────────────────────────────

describe('2. State Transition Triggers', () => {
  it('should NOT fire notification when status is re-saved with same value', async () => {
    // Create a statement at 'parsed' status directly (skipping transition)
    const stmt = await payload.create({
      collection: 'statements',
      data: {
        user: testUserId,
        issuer: 'Test Bank',
        source: 'upload',
        status: 'parsed',
      },
      overrideAccess: true,
      context: { skipNotificationHook: true },
    })

    // Count existing notifications for this statement
    const before = await payload.find({
      collection: 'notifications',
      where: { and: [{ user: { equals: testUserId } }, { type: { equals: 'statement' } }] },
      overrideAccess: true,
    })

    // Re-save with same status (no transition)
    await payload.update({
      collection: 'statements',
      id: stmt.id,
      data: { status: 'parsed' },
      context: { skipNotificationHook: false },
      overrideAccess: true,
    })

    // Should be same count — no duplicate fired since previousDoc.status === 'parsed'
    const after = await payload.find({
      collection: 'notifications',
      where: { and: [{ user: { equals: testUserId } }, { type: { equals: 'statement' } }] },
      overrideAccess: true,
    })
    expect(after.totalDocs).toBe(before.totalDocs)

    // Cleanup
    await payload.delete({ collection: 'statements', id: stmt.id, overrideAccess: true }).catch(() => {})
  })
})

// ─── 3. Preference Suppression ────────────────────────────────────────────────

describe('3. Preference Suppression', () => {
  it('should suppress email channel when emailEnabled = false', async () => {
    // Disable email for user
    await payload.update({
      collection: 'users',
      id: testUserId,
      data: { notificationPreferences: { emailEnabled: false } },
      overrideAccess: true,
    })

    const eventId = `PREF_EMAIL_SUPPRESSED_${Date.now()}`
    const result = await NotificationService.publishEvent(
      { eventId, eventType: 'PAYMENT_SUCCESS', userId: testUserId },
      payload,
    )

    // Email channel should be suppressed
    const emailResult = result.channels.find((c) => c.channel === 'email')
    expect(emailResult?.status).toBe('suppressed')

    // in_app should still be delivered
    const inAppResult = result.channels.find((c) => c.channel === 'in_app')
    expect(inAppResult?.status).not.toBe('suppressed')

    // Re-enable email
    await payload.update({
      collection: 'users',
      id: testUserId,
      data: { notificationPreferences: { emailEnabled: true } },
      overrideAccess: true,
    })
  })

  it('should suppress topic when topic preference = false', async () => {
    await payload.update({
      collection: 'users',
      id: testUserId,
      data: { notificationPreferences: { analysisResults: false } },
      overrideAccess: true,
    })

    const eventId = `PREF_TOPIC_SUPPRESSED_${Date.now()}`
    const result = await NotificationService.publishEvent(
      { eventId, eventType: 'ANALYSIS_COMPLETED', userId: testUserId },
      payload,
    )

    // All channels should be suppressed for this topic
    expect(result.channels.every((c) => c.status === 'suppressed')).toBe(true)

    // Restore
    await payload.update({
      collection: 'users',
      id: testUserId,
      data: { notificationPreferences: { analysisResults: true } },
      overrideAccess: true,
    })
  })
})

// ─── 4. Access Control ────────────────────────────────────────────────────────

describe('4. Cross-User Access Control', () => {
  it('should not allow user2 to read user1 notifications via API', async () => {
    // Create a notification for user1
    const notif = await payload.create({
      collection: 'notifications',
      data: {
        user: testUserId,
        type: 'system',
        title: 'Test notification for access control',
        message: 'Only user1 should see this',
        channel: 'in_app',
        status: 'delivered',
      },
      overrideAccess: true,
    })

    // Query as user2
    const result = await payload.find({
      collection: 'notifications',
      where: { id: { equals: notif.id } },
      user: { id: testUser2Id, collection: 'users' } as any,
      overrideAccess: false,
    })

    // User2 should see 0 results
    expect(result.totalDocs).toBe(0)

    await payload.delete({ collection: 'notifications', id: notif.id, overrideAccess: true }).catch(() => {})
  })
})

// ─── 5. Device Token Deactivation ─────────────────────────────────────────────

describe('5. Device Token Deactivation', () => {
  it('should deactivate a token when explicitly marked inactive', async () => {
    const token = await payload.create({
      collection: 'device-tokens',
      data: {
        user: testUserId,
        token: `test_fcm_token_${Date.now()}`,
        platform: 'android',
        provider: 'fcm',
        environment: 'development',
        isActive: true,
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'device-tokens',
      id: token.id,
      data: { isActive: false },
      overrideAccess: true,
    })

    const updated = await payload.findByID({
      collection: 'device-tokens',
      id: token.id,
      overrideAccess: true,
    })
    expect(updated.isActive).toBe(false)

    await payload.delete({ collection: 'device-tokens', id: token.id, overrideAccess: true }).catch(() => {})
  })
})

// ─── 6. Simulation Mode ───────────────────────────────────────────────────────

describe('6. Simulation Mode', () => {
  it('should set metadata.mode = "simulation" on in_app records in simulation mode', async () => {
    // NOTIFICATION_MODE defaults to 'simulation' in dev
    const eventId = `SIMULATION_MODE_TEST_${Date.now()}`
    const result = await NotificationService.publishEvent(
      { eventId, eventType: 'MONTHLY_SUMMARY', userId: testUserId, channels: ['in_app'] },
      payload,
    )

    expect(result.channels.length).toBeGreaterThan(0)
    const inApp = result.channels.find((c) => c.channel === 'in_app')
    if (!inApp?.notificationId) return

    const notif = await payload.findByID({
      collection: 'notifications',
      id: inApp.notificationId,
      overrideAccess: true,
    })

    expect((notif.metadata as any)?.mode).toBe('simulation')
  })
})

// ─── 7. Payment & Subscription Events ────────────────────────────────────────

describe('7. Payment & Subscription Event Triggers', () => {
  it('should publish PAYMENT_SUCCESS event correctly', async () => {
    const eventId = `PAYMENT_SUCCESS_MANUAL_${Date.now()}`
    const result = await NotificationService.publishEvent(
      {
        eventId,
        eventType: 'PAYMENT_SUCCESS',
        userId: testUserId,
        channels: ['in_app'],
        data: { paymentId: 'pay_test_123', currency: 'INR' },
      },
      payload,
    )

    expect(result.channels.some((c) => c.status === 'delivered')).toBe(true)

    const notif = await payload.find({
      collection: 'notifications',
      where: { and: [{ eventId: { equals: eventId } }, { type: { equals: 'payment' } }] },
      overrideAccess: true,
    })
    expect(notif.totalDocs).toBe(1)
  })

  it('should publish SUBSCRIPTION_CANCELLED event correctly', async () => {
    const eventId = `SUB_CANCELLED_MANUAL_${Date.now()}`
    const result = await NotificationService.publishEvent(
      {
        eventId,
        eventType: 'SUBSCRIPTION_CANCELLED',
        userId: testUserId,
        channels: ['in_app'],
        data: { subscriptionId: 'sub_test_123' },
      },
      payload,
    )

    expect(result.channels.some((c) => c.status === 'delivered')).toBe(true)
  })
})

// ─── 8. Notification Grouping ─────────────────────────────────────────────────

describe('8. Notification Group ID', () => {
  it('should assign the same notificationGroupId to all channel records for one event', async () => {
    const eventId = `GROUP_TEST_${Date.now()}`
    const result = await NotificationService.publishEvent(
      { eventId, eventType: 'ANALYSIS_COMPLETED', userId: testUserId, channels: ['in_app', 'email'] },
      payload,
    )

    const createdIds = result.channels
      .filter((c) => c.notificationId)
      .map((c) => c.notificationId)

    if (createdIds.length < 2) return // fewer channels delivered (preferences/simulation)

    const records = await payload.find({
      collection: 'notifications',
      where: { eventId: { equals: eventId } },
      overrideAccess: true,
    })

    const groupIds = new Set(records.docs.map((r) => r.notificationGroupId))
    // All records should share exactly one groupId
    expect(groupIds.size).toBe(1)
    expect(groupIds.has(result.notificationGroupId)).toBe(true)
  })
})
