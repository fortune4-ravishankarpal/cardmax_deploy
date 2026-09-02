import { getPayloadClient } from '@/lib/client'
import bankSeeder from './banks.seed'
import { seedAdmin } from './admin.seed'
import { seedSubscriptionPlans } from './subscriptionPlans.seed'
import { seedDummyData } from './subscription_dummy.seed'


async function main() {
    const payload = await getPayloadClient()
    try {
        await seedAdmin(payload)
        await bankSeeder(payload)
        await seedSubscriptionPlans(payload)
        await seedDummyData(payload)
        process.exit(0)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

void main()
