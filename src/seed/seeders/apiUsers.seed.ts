import type { Payload } from 'payload'

export async function seedApiUsers(payload: Payload) {
  payload.logger.info('--- Seeding API Users ---')

  const usersToSeed = [
    {
      name: 'API Administrator',
      email: 'api-admin@cardmax.com',
      password: 'Admin@123456',
      role: 'admin' as const,
      status: 'active' as const,
      permissions: [],
    },
    {
      name: 'Developer One (Dev1)',
      email: 'dev1@cardmax.com',
      password: 'Dev1@123456',
      role: 'developer' as const,
      status: 'active' as const,
      permissions: [
        {
          collection: 'users',
          methods: ['read', 'create'],
        },
        {
          collection: 'banks',
          methods: ['read'],
        },
        {
          collection: 'cards',
          methods: ['read', 'create'],
        },
        {
          collection: 'category-master',
          methods: ['read'],
        },
      ],
    },
    {
      name: 'Developer Two (Dev2)',
      email: 'dev2@cardmax.com',
      password: 'Dev2@123456',
      role: 'developer' as const,
      status: 'active' as const,
      permissions: [
        {
          collection: 'banks',
          methods: ['read'],
        },
        {
          collection: 'merchant-master',
          methods: ['read', 'create'],
        },
        {
          collection: 'subscription-plans',
          methods: ['read'],
        },
      ],
    },
  ]

  for (const userData of usersToSeed) {
    try {
      const existing = await payload.find({
        collection: 'api-users',
        where: {
          email: { equals: userData.email },
        },
        limit: 1,
      })

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'api-users',
          data: userData as any,
        })
        payload.logger.info(`Created API User: ${userData.email} (${userData.role})`)
      } else {
        // Update permissions & role to ensure current configuration
        await payload.update({
          collection: 'api-users',
          id: existing.docs[0].id,
          data: {
            password: userData.password,
            role: userData.role,
            permissions: userData.permissions as any,
            status: userData.status,
          },
        })
        payload.logger.info(`Updated API User: ${userData.email} (${userData.role})`)
      }
    } catch (error) {
      payload.logger.error(`Error seeding API user ${userData.email}: ${error}`)
    }
  }
}
