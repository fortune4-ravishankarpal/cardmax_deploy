import { getPayload } from 'payload';
import config from './src/payload.config';
import { sql } from 'drizzle-orm';

async function run() {
  const payload = await getPayload({ config });
  
  if (payload.db && payload.db.drizzle) {
    await payload.db.drizzle.execute(sql`DROP TABLE IF EXISTS "payload_migrations";`);
    console.log("payload_migrations table successfully dropped!");
  } else {
    console.log("Could not access Drizzle instance.");
  }
  process.exit(0);
}

run();
