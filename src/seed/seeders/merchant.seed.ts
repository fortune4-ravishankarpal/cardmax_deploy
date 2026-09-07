import { Payload } from "payload";
import merchantJson from "./../data/merchant.data.json";
// @ts-ignore
import type { MerchantMaster } from 'payload'

export default async function merchantSeeder(payload: Payload) {
    console.time("MERCHANT SEEDER INIT");
    try {
        for (const merchant of merchantJson) {
            try {
                let merchantInfo = merchant as MerchantMaster
                await payload.create({
                    collection: "merchant-master",
                    data: { ...merchantInfo },
                });
                payload.logger.info("Completed " + merchant.name);
            } catch (error: any) {
                payload.logger.error("Failed to create merchant" + error);
            }
        }
    } catch (error) {
        console.error("Merchant seeder error:", error);
    } finally {
        console.timeEnd("MERCHANT SEEDER INIT");
    }
}