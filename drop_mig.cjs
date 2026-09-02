import('pg').then(pg => {
  const { Client } = pg.default;
  const client = new Client({ connectionString: 'postgres://postgres:Admin@1234@192.168.10.122:5432/cardmax_frontend' });
  client.connect()
    .then(() => client.query('DROP TABLE IF EXISTS "payload_migrations";'))
    .then(() => {
      console.log('Migrations table dropped.');
      process.exit(0);
    });
});
