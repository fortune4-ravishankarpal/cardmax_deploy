import { env } from '@/lib/env'
import { isDuplicateError } from '@/utilities/duplicate'
import { Payload } from 'payload'

export async function seedAdmin(payload: Payload) {
    try {
        const response = await payload.create({
            collection: 'admin',
            data: {
                email: env.CMS_SEED_ADMIN_EMAIL,
                password: env.CMS_SEED_ADMIN_PASSWORD,
                // role: 'super_admin',
            },
        })
        payload.logger.info('Admin user created')
    } catch (error) {
        if (isDuplicateError(error, 'email')) {
            payload.logger.info('Admin user already exists')
        } else {
            payload.logger.error('Error seeding admin user')
        }
    }
}
