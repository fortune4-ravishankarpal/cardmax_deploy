import { Payload } from "payload";
import bankJson from "./../data/bank.data.json";
// @ts-ignore
import type { Banks } from 'payload'
export default async function bankSeeder(payload: Payload) {
    console.time("BANK SEEDER INIT");
    try {
        for (const bank of bankJson) {
            try {
                let bankInfo = bank as Banks
                await payload.create({
                    collection: "banks",
                    data: { ...bankInfo, dataVersion: (bank as any).dataVersion ?? 'v1', },
                });
                payload.logger.info("Completed " + bank.name);
            } catch (error: any) {
                payload.logger.error("Failed to create bank" + error);
            }
        }
    } catch (error) {
        console.error("Bank seeder error:", error);
    } finally {
        console.timeEnd("BANK SEEDER INIT");
    }
}