import { getPayloadClient } from '@/lib/client'
import bankSeeder from './banks.seed'
import categorySeeder from './category.seed'
import merchantSeeder from './merchant.seed'
import { seedAdmin } from './admin.seed'
import { seedApiUsers } from './apiUsers.seed'
import { seedSubscriptionPlans } from './subscriptionPlans.seed'
import { seedDummyData } from './subscription_dummy.seed'


async function main() {
    const payload = await getPayloadClient()
    try {
        await seedAdmin(payload)
        await seedApiUsers(payload)
        await bankSeeder(payload)
        await seedSubscriptionPlans(payload)
        await seedDummyData(payload)
        await categorySeeder(payload)
        await merchantSeeder(payload)
        process.exit(0)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

void main()
