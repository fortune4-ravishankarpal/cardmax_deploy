import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
sql\DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;\
  .then(() => { console.log('Schema dropped'); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
