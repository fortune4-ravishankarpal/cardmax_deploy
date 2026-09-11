import { Payload } from "payload";
import categoryJson from "./../data/category.data.json";
// @ts-ignore
import type { CategoryMaster } from 'payload'

export default async function categorySeeder(payload: Payload) {
    console.time("CATEGORY SEEDER INIT");
    try {
        for (const category of categoryJson) {
            try {
                let categoryInfo = category as CategoryMaster
                await payload.create({
                    collection: "category-master",
                    data: { ...categoryInfo },
                });
                payload.logger.info("Completed " + category.name);
            } catch (error: any) {
                payload.logger.error("Failed to create category" + error);
            }
        }
    } catch (error) {
        console.error("Category seeder error:", error);
    } finally {
        console.timeEnd("CATEGORY SEEDER INIT");
    }
}