const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,  // set dalam .env.local (jangan commit)
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  console.log('connected');

  const r = await client.query(
    `ALTER TABLE public.trades
     ADD COLUMN IF NOT EXISTS volume numeric(12,2)`
  );
  console.log('column volume ready');

  const v = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns
     WHERE table_schema='public' AND table_name='trades' ORDER BY ordinal_position`
  );
  console.log('columns:', v.rows.map(x => x.column_name).join(', '));

  await client.end();
  console.log('done');
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
